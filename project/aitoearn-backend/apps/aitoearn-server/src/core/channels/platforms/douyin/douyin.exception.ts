import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  PlatformSpecificExceptionInput,
  PlatformValidationExceptionInput,
} from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface DouyinPlatformResponseData {
  error_code?: number | string
  errorCode?: number | string
  err_no?: number | string
  description?: string
  err_msg?: string
  errTips?: string
  access_token?: string
  [key: string]: unknown
}

export interface DouyinPlatformResponseBody {
  data?: DouyinPlatformResponseData
  extra?: {
    error_code?: number | string
    description?: string
    sub_description?: string
  }
  err_no?: number | string
  err_msg?: string
  err_tips?: string
  error_code?: number | string
  description?: string
  error_description?: string
  message?: string
  errTips?: string
}

interface DouyinPlatformErrorInfo {
  code?: number | string
  message?: string
}

interface DouyinPlatformErrorPolicy {
  code: ResponseCode
  category: PlatformErrorCategory
  retryable?: boolean
}

export class DouyinPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Douyin })
  }

  static validation(input: PlatformValidationExceptionInput): DouyinPlatformException {
    return new DouyinPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<DouyinPlatformResponseBody>): DouyinPlatformException {
    const response = error.response
    const platformError = response
      ? DouyinPlatformException.platformErrorFromBody(response.data)
      : {}
    const endpoint = DouyinPlatformException.endpointFromConfig(response?.config ?? error.config)
    const policy = DouyinPlatformException.policyFromPlatformCode(platformError.code, endpoint)

    return new DouyinPlatformException({
      code: policy?.code ?? DouyinPlatformException.codeFromEndpoint(endpoint),
      category: policy?.category ?? DouyinPlatformException.categoryFromError(endpoint, response?.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: DouyinPlatformException.causeTypeFromAxiosError(error, platformError.code),
        httpStatus: response?.status,
        platformCode: platformError.code,
        platformMessage: policy ? undefined : platformError.message ?? error.message,
        raw: response?.data ?? error,
      },
      retryable: policy?.retryable ?? (response ? isHttpStatusRetryable(response.status) : true),
    })
  }

  static fromPlatformResponse(response: AxiosResponse<DouyinPlatformResponseBody>): DouyinPlatformException {
    const platformError = DouyinPlatformException.platformErrorFromBody(response.data)
    const endpoint = DouyinPlatformException.endpointFromConfig(response.config)
    const policy = DouyinPlatformException.policyFromPlatformCode(platformError.code, endpoint)

    return new DouyinPlatformException({
      code: policy?.code ?? DouyinPlatformException.codeFromEndpoint(endpoint),
      category: policy?.category ?? DouyinPlatformException.categoryFromError(endpoint, response.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: platformError.code === undefined ? PlatformErrorCauseType.Http : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode: platformError.code,
        platformMessage: policy ? undefined : platformError.message,
        raw: response.data,
      },
      retryable: policy?.retryable,
    })
  }

  static hasPlatformError(response: AxiosResponse<DouyinPlatformResponseBody>): boolean {
    return DouyinPlatformException.platformErrorFromBody(response.data).code !== undefined
  }

  static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }

    const method = config.method?.toUpperCase()
    const path = DouyinPlatformException.pathFromUrl(config.url, config.baseURL)
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
    error: AxiosError<DouyinPlatformResponseBody>,
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

  private static policyFromPlatformCode(platformCode?: string | number, endpoint?: string): DouyinPlatformErrorPolicy | undefined {
    switch (String(platformCode)) {
      case '10008':
      case '2190008':
      case '28001008':
        return {
          code: ResponseCode.ChannelAccessTokenFailed,
          category: PlatformErrorCategory.Auth,
        }

      case '28001003':
        if (endpoint?.includes('/share-id/')) {
          return {
            code: ResponseCode.ChannelAccessTokenFailed,
            category: PlatformErrorCategory.Auth,
          }
        }
        return undefined

      case '10020':
        return {
          code: ResponseCode.ChannelPlatformRateLimited,
          category: PlatformErrorCategory.RateLimit,
          retryable: true,
        }

      case '28001005':
      case '28001006':
        return {
          code: ResponseCode.ChannelPlatformServiceUnavailable,
          category: PlatformErrorCategory.PlatformUnavailable,
          retryable: true,
        }

      case '28001014':
      case '28001016':
      case '28001018':
      case '28001019':
        return {
          code: ResponseCode.ChannelPlatformPermissionMissing,
          category: PlatformErrorCategory.Permission,
        }

      case '28003017':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Quota,
        }

      case '10002':
      case '28001007':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Validation,
        }

      case '10003':
      case '10013':
        return {
          code: ResponseCode.ChannelAccessTokenFailed,
          category: PlatformErrorCategory.Auth,
        }

      default:
        return undefined
    }
  }

  private static codeFromEndpoint(endpoint?: string): ResponseCode {
    if (endpoint?.includes('/oauth/client_token/')
      || endpoint?.includes('/oauth/access_token/')
      || endpoint?.includes('/oauth/refresh_token/')
      || endpoint?.includes('/oauth/renew_refresh_token/')
      || endpoint?.includes('/api/apps/v2/jscode2session')) {
      return ResponseCode.ChannelAccessTokenFailed
    }
    if (endpoint?.includes('/video/upload_video/')
      || endpoint?.includes('/video/upload_image/')) {
      return ResponseCode.ChannelPlatformMediaProcessingFailed
    }

    return ResponseCode.ChannelPlatformApiFailed
  }

  private static categoryFromEndpoint(endpoint?: string): PlatformErrorCategory {
    if (endpoint?.includes('/oauth/')
      || endpoint?.includes('/api/apps/v1/qrcode/create/')
      || endpoint?.includes('/api/apps/v2/jscode2session')) {
      return PlatformErrorCategory.Auth
    }
    if (endpoint?.includes('/video/upload_video/')
      || endpoint?.includes('/video/upload_image/')) {
      return PlatformErrorCategory.MediaProcessingFailed
    }
    return PlatformErrorCategory.Unknown
  }

  private static categoryFromError(endpoint?: string, status?: number): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }

    const category = DouyinPlatformException.categoryFromEndpoint(endpoint)
    if (category !== PlatformErrorCategory.Unknown) {
      return category
    }

    return categoryFromHttpStatus(status)
  }

  private static platformErrorFromBody(body: DouyinPlatformResponseBody): DouyinPlatformErrorInfo {
    if (body.extra && DouyinPlatformException.isErrorCode(body.extra.error_code)) {
      return {
        code: body.extra.error_code,
        message: body.extra.sub_description ?? body.extra.description,
      }
    }

    if (DouyinPlatformException.isErrorCode(body.err_no)) {
      return {
        code: body.err_no,
        message: body.err_msg ?? body.err_tips ?? body.message ?? body.description,
      }
    }

    if (body.data && DouyinPlatformException.isErrorCode(body.data.error_code)) {
      return {
        code: body.data.error_code,
        message: body.data.description ?? body.data.err_msg ?? body.message,
      }
    }

    if (body.data && DouyinPlatformException.isErrorCode(body.data.errorCode)) {
      return {
        code: body.data.errorCode,
        message: body.data.description ?? body.data.errTips ?? body.errTips,
      }
    }

    if (DouyinPlatformException.isErrorCode(body.error_code)) {
      return {
        code: body.error_code,
        message: body.description ?? body.error_description ?? body.message,
      }
    }

    return {}
  }

  private static isErrorCode(code?: number | string): boolean {
    return code !== undefined && code !== 0 && code !== '0' && code !== ''
  }
}
