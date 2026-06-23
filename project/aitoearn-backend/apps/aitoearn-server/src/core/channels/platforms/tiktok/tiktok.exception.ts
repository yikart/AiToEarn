import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ChannelPlatformErrorContext, PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface TikTokPlatformResponseBody {
  data?: unknown
  error?: {
    code?: string
    message?: string
    log_id?: string
  } | string
  error_description?: string
  message?: string
  code?: string | number
}

interface TikTokPlatformErrorInfo {
  code?: string | number
  message?: string
}

interface TikTokPlatformErrorPolicy {
  code: ResponseCode
  category: PlatformErrorCategory
  platformMessage?: string
  retryable?: boolean
}

const TIKTOK_DIRECT_POST_PRIVATE_ONLY_MESSAGE = '未审核 TikTok Direct Post 客户端只能私密发布，请选择 SELF_ONLY 或完成 TikTok app 审核'

export class TikTokPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.TikTok })
  }

  static validation(input: PlatformValidationExceptionInput): TikTokPlatformException {
    return new TikTokPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<TikTokPlatformResponseBody>): TikTokPlatformException {
    const response = error.response
    const body = response?.data
    const endpoint = TikTokPlatformException.endpointFromConfig(response?.config ?? error.config)
    const platformError = TikTokPlatformException.platformErrorFromBody(body)
    const policy = TikTokPlatformException.policyFromPlatformError(platformError)
    return new TikTokPlatformException({
      code: policy?.code ?? TikTokPlatformException.codeFromEndpoint(endpoint),
      category: policy?.category ?? TikTokPlatformException.categoryFromError(endpoint, response?.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: TikTokPlatformException.causeTypeFromAxiosError(error, platformError.code),
        httpStatus: response?.status,
        platformCode: platformError.code,
        platformMessage: policy?.platformMessage ?? platformError.message ?? error.message,
        raw: body ?? error,
      },
      retryable: policy?.retryable ?? (response ? isHttpStatusRetryable(response.status) : true),
    })
  }

  static fromPlatformResponse(response: AxiosResponse<TikTokPlatformResponseBody>): TikTokPlatformException {
    const endpoint = TikTokPlatformException.endpointFromConfig(response.config)
    const platformError = TikTokPlatformException.platformErrorFromBody(response.data)
    const policy = TikTokPlatformException.policyFromPlatformError(platformError)
    return new TikTokPlatformException({
      code: policy?.code ?? TikTokPlatformException.codeFromEndpoint(endpoint),
      category: policy?.category ?? TikTokPlatformException.categoryFromError(endpoint, response.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: platformError.code === undefined ? PlatformErrorCauseType.Http : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode: platformError.code,
        platformMessage: policy?.platformMessage ?? platformError.message,
        raw: response.data,
      },
      retryable: policy?.retryable ?? false,
    })
  }

  static hasPlatformError(response: AxiosResponse<TikTokPlatformResponseBody>): boolean {
    return TikTokPlatformException.platformErrorFromBody(response.data).code !== undefined
  }

  static fromPlatformError(input: {
    code: ResponseCode
    category?: PlatformErrorCategory
    context?: ChannelPlatformErrorContext
    platformCode: string | number
    platformMessage?: string
    raw?: TikTokPlatformResponseBody
    retryable?: boolean
  }): TikTokPlatformException {
    return new TikTokPlatformException({
      code: input.code,
      category: input.category ?? PlatformErrorCategory.Unknown,
      context: input.context,
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: input.platformCode,
        platformMessage: input.platformMessage,
        raw: input.raw,
      },
      retryable: input.retryable,
    })
  }

  private static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = TikTokPlatformException.pathFromUrl(config.url, config.baseURL)
    return method ? `${method} ${path}` : path
  }

  private static codeFromEndpoint(endpoint?: string): ResponseCode {
    if (endpoint?.includes('/oauth/')) {
      return ResponseCode.ChannelAccessTokenFailed
    }
    if (endpoint?.includes('/post/publish/')
      || endpoint?.includes('/video/upload/')
      || endpoint?.includes('/upload/')) {
      return ResponseCode.ChannelPlatformMediaProcessingFailed
    }
    return ResponseCode.ChannelPlatformApiFailed
  }

  private static categoryFromEndpoint(endpoint?: string): PlatformErrorCategory {
    if (endpoint?.includes('/oauth/')) {
      return PlatformErrorCategory.Auth
    }
    if (endpoint?.includes('/post/publish/')
      || endpoint?.includes('/video/upload/')
      || endpoint?.includes('/upload/')) {
      return PlatformErrorCategory.MediaProcessingFailed
    }
    return PlatformErrorCategory.Unknown
  }

  private static categoryFromError(endpoint?: string, status?: number): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }

    const category = TikTokPlatformException.categoryFromEndpoint(endpoint)
    if (category !== PlatformErrorCategory.Unknown) {
      return category
    }

    return categoryFromHttpStatus(status)
  }

  private static platformErrorFromBody(body?: TikTokPlatformResponseBody): TikTokPlatformErrorInfo {
    if (!body) {
      return {}
    }

    if (typeof body.error === 'object' && body.error?.code && body.error.code !== 'ok') {
      return {
        code: body.error.code,
        message: body.error.message,
      }
    }

    if (typeof body.error === 'string' && body.error && body.error !== 'ok') {
      return {
        code: body.error,
        message: body.error_description ?? body.message,
      }
    }

    if (body.code !== undefined && body.code !== 0 && body.code !== '0') {
      return {
        code: body.code,
        message: body.message ?? body.error_description,
      }
    }

    return {}
  }

  private static policyFromPlatformError(error: TikTokPlatformErrorInfo): TikTokPlatformErrorPolicy | undefined {
    switch (String(error.code ?? '').toLowerCase()) {
      case 'unaudited_client_can_only_post_to_private_accounts':
        return {
          code: ResponseCode.ChannelPlatformPermissionMissing,
          category: PlatformErrorCategory.Permission,
          platformMessage: TIKTOK_DIRECT_POST_PRIVATE_ONLY_MESSAGE,
        }

      case 'spam_risk_too_many_posts':
        return {
          code: ResponseCode.ChannelPlatformRateLimited,
          category: PlatformErrorCategory.RateLimit,
        }

      case 'url_ownership_unverified':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Validation,
        }

      default:
        return undefined
    }
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
    error: AxiosError<TikTokPlatformResponseBody>,
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
