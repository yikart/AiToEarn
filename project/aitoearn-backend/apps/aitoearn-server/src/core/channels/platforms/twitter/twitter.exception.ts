import type { ApiError } from '@xdevplatform/xdk'
import type { ResponseCode as ResponseCodeType } from '@yikart/common'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ChannelPlatformErrorContext, PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

interface TwitterSdkProblem {
  code?: string | number
  title?: string
  detail?: string
  message?: string
}

interface TwitterSdkErrorData {
  code?: string | number
  message?: string
  title?: string
  detail?: string
  error?: string
  error_description?: string
  errors?: TwitterSdkProblem[]
}

export interface TwitterOAuthErrorBody {
  error?: string
  error_description?: string
  message?: string
}

export type TwitterExceptionMetadata = {
  mediaUrl?: string
} & Record<string, string | undefined>

export interface TwitterWorkLinkExceptionData {
  link?: string
  platformWorkId?: string
  reason?: string
}

export interface TwitterWorkNotFoundExceptionData {
  accountId?: string
  platformWorkId?: string
  postId?: string
}

export class TwitterPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput)
  constructor(message: string, data?: TwitterExceptionMetadata)
  constructor(inputOrMessage: PlatformSpecificExceptionInput | string, data?: TwitterExceptionMetadata) {
    if (typeof inputOrMessage === 'string') {
      super({
        code: ResponseCode.ChannelPlatformApiFailed,
        platform: AccountType.Twitter,
        category: PlatformErrorCategory.Unknown,
        context: { metadata: data },
        cause: {
          type: PlatformErrorCauseType.Unknown,
          platformMessage: inputOrMessage,
          raw: data,
        },
      })
      return
    }

    super({ ...inputOrMessage, platform: AccountType.Twitter })
  }

  static validation(input: PlatformValidationExceptionInput): TwitterPlatformException {
    return new TwitterPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromSdkApiError(error: ApiError, input: {
    code: ResponseCodeType
    category?: PlatformErrorCategory
    context?: ChannelPlatformErrorContext
    retryable?: boolean
  }): TwitterPlatformException {
    const data = error.data as TwitterSdkErrorData | undefined
    const problem = data?.errors?.[0]
    return new TwitterPlatformException({
      code: input.code,
      category: input.category ?? categoryFromHttpStatus(error.status),
      context: input.context,
      cause: {
        type: PlatformErrorCauseType.SdkError,
        httpStatus: error.status,
        platformCode: problem?.code ?? data?.code ?? error.status,
        platformMessage: problem?.detail
          ?? problem?.message
          ?? problem?.title
          ?? data?.detail
          ?? data?.message
          ?? data?.error_description
          ?? data?.error
          ?? error.message,
        raw: data,
      },
      retryable: input.retryable ?? isHttpStatusRetryable(error.status),
    })
  }

  static fromSdkOAuthError(error: Error, input: {
    code: ResponseCodeType
    category?: PlatformErrorCategory
    context?: ChannelPlatformErrorContext
    retryable?: boolean
  }): TwitterPlatformException {
    return new TwitterPlatformException({
      code: input.code,
      category: input.category ?? PlatformErrorCategory.Auth,
      context: input.context,
      cause: {
        type: PlatformErrorCauseType.SdkError,
        platformMessage: error.message,
        raw: {
          name: error.name,
          message: error.message,
        },
      },
      retryable: input.retryable ?? false,
    })
  }

  static fromAxiosError(error: AxiosError<TwitterSdkErrorData | string>): TwitterPlatformException {
    const response = error.response
    const data = response?.data
    const body = typeof data === 'object' && data !== null && !Array.isArray(data) ? data : undefined
    const problem = body?.errors?.[0]
    const platformCode = problem?.code ?? body?.code ?? body?.error
    const endpoint = TwitterPlatformException.endpointFromConfig(response?.config ?? error.config)
    return new TwitterPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: TwitterPlatformException.categoryFromAxiosError(response?.status, endpoint),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: TwitterPlatformException.causeTypeFromAxiosError(error, platformCode),
        httpStatus: response?.status,
        platformCode: platformCode ?? response?.status,
        platformMessage: problem?.detail
          ?? problem?.message
          ?? problem?.title
          ?? body?.detail
          ?? body?.message
          ?? body?.error_description
          ?? body?.error
          ?? (typeof data === 'string' ? data : undefined)
          ?? error.message,
        raw: data ?? error,
      },
      retryable: response ? isHttpStatusRetryable(response.status) : true,
    })
  }

  private static categoryFromAxiosError(status?: number, endpoint?: string): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }
    if (endpoint?.includes('/oauth2/')) {
      return PlatformErrorCategory.Auth
    }
    if (status === 413 && endpoint?.includes('/2/media/upload')) {
      return PlatformErrorCategory.Validation
    }
    return categoryFromHttpStatus(status)
  }

  private static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = TwitterPlatformException.pathFromUrl(config.url, config.baseURL)
    return method ? `${method} ${path}` : path
  }

  private static pathFromUrl(rawUrl: string, baseURL?: string): string {
    try {
      return new URL(rawUrl, baseURL).pathname
    }
    catch {
      return rawUrl.split('?')[0] || rawUrl
    }
  }

  private static causeTypeFromAxiosError(
    error: AxiosError<TwitterSdkErrorData | string>,
    platformCode?: string | number,
  ): PlatformErrorCauseType {
    if (platformCode !== undefined) {
      return PlatformErrorCauseType.Platform
    }
    if (error.response) {
      return PlatformErrorCauseType.Http
    }
    if (isNetworkErrorCode(error.code)) {
      return PlatformErrorCauseType.Network
    }
    return PlatformErrorCauseType.Unknown
  }
}

export class TwitterWorkLinkException extends AppException {
  constructor(data?: TwitterWorkLinkExceptionData) {
    super(ResponseCode.InvalidWorkLink, data)
  }
}

export class TwitterWorkNotFoundException extends AppException {
  constructor(data?: TwitterWorkNotFoundExceptionData) {
    super(ResponseCode.WorkDetailNotFound, data)
  }
}
