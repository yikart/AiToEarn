import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface BilibiliPlatformResponseBody {
  code?: number | string
  message?: string
  msg?: string
  data?: unknown
  request_id?: string
}

interface BilibiliPlatformErrorPolicy {
  code: ResponseCode
  category: PlatformErrorCategory
  retryable?: boolean
}

export class BilibiliPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Bilibili })
  }

  static validation(input: PlatformValidationExceptionInput): BilibiliPlatformException {
    return new BilibiliPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<BilibiliPlatformResponseBody>): BilibiliPlatformException {
    const response = error.response
    const body = response?.data
    const endpoint = BilibiliPlatformException.endpointFromConfig(response?.config ?? error.config)
    const platformCode = body?.code
    const policy = BilibiliPlatformException.policyFromPlatformCode(platformCode)
    const serviceUnavailable = !policy && response?.status !== undefined && response.status >= 500
    return new BilibiliPlatformException({
      code: policy?.code
        ?? (serviceUnavailable ? ResponseCode.ChannelPlatformServiceUnavailable : BilibiliPlatformException.codeFromEndpoint(endpoint)),
      category: policy?.category
        ?? (serviceUnavailable ? PlatformErrorCategory.PlatformUnavailable : BilibiliPlatformException.categoryFromError(endpoint, response?.status)),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: BilibiliPlatformException.causeTypeFromAxiosError(error, platformCode),
        httpStatus: response?.status,
        platformCode,
        platformMessage: policy || serviceUnavailable ? undefined : body?.message ?? body?.msg ?? error.message,
        raw: body ?? error,
      },
      retryable: policy?.retryable ?? (response ? isHttpStatusRetryable(response.status) : true),
    })
  }

  static fromPlatformResponse(response: AxiosResponse<BilibiliPlatformResponseBody>): BilibiliPlatformException {
    const endpoint = BilibiliPlatformException.endpointFromConfig(response.config)
    const policy = BilibiliPlatformException.policyFromPlatformCode(response.data.code)
    const serviceUnavailable = !policy && response.status >= 500
    return new BilibiliPlatformException({
      code: policy?.code
        ?? (serviceUnavailable ? ResponseCode.ChannelPlatformServiceUnavailable : BilibiliPlatformException.codeFromEndpoint(endpoint)),
      category: policy?.category
        ?? (serviceUnavailable ? PlatformErrorCategory.PlatformUnavailable : BilibiliPlatformException.categoryFromError(endpoint, response.status)),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: response.data.code === undefined ? PlatformErrorCauseType.Http : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode: response.data.code,
        platformMessage: policy || serviceUnavailable ? undefined : response.data.message ?? response.data.msg,
        raw: response.data,
      },
      retryable: policy?.retryable ?? (serviceUnavailable ? true : undefined),
    })
  }

  static hasPlatformError(response: AxiosResponse<BilibiliPlatformResponseBody>): boolean {
    return response.data.code !== undefined && response.data.code !== 0 && response.data.code !== '0'
  }

  private static policyFromPlatformCode(platformCode?: string | number): BilibiliPlatformErrorPolicy | undefined {
    switch (String(platformCode)) {
      case '-500':
      case '4010':
      case '4011':
      case '122009':
      case '122010':
      case '123002':
      case '123023':
      case '123039':
      case '123044':
      case '129020':
      case '129021':
      case '130004':
      case '130005':
      case '130006':
      case '131001':
        return {
          code: ResponseCode.ChannelPlatformServiceUnavailable,
          category: PlatformErrorCategory.PlatformUnavailable,
          retryable: true,
        }

      case '127009':
      case '127306':
      case '123026':
        return {
          code: ResponseCode.ChannelPlatformRateLimited,
          category: PlatformErrorCategory.RateLimit,
          retryable: true,
        }

      case '122000':
      case '122001':
      case '122002':
      case '122008':
      case '127000':
      case '127001':
      case '127002':
      case '127003':
      case '127004':
      case '127008':
      case '127022':
      case '127023':
        return {
          code: ResponseCode.ChannelAccessTokenFailed,
          category: PlatformErrorCategory.Auth,
        }

      case '122007':
        return {
          code: ResponseCode.ChannelRefreshTokenFailed,
          category: PlatformErrorCategory.Auth,
        }

      case '4002':
      case '4003':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Auth,
        }

      case '123001':
      case '127005':
      case '127006':
      case '127007':
      case '127010':
      case '127011':
      case '127304':
      case '127305':
      case '130001':
        return {
          code: ResponseCode.ChannelPlatformPermissionMissing,
          category: PlatformErrorCategory.Permission,
        }

      case '4000':
      case '4001':
      case '4005':
      case '4006':
      case '4007':
      case '4008':
      case '4009':
      case '123008':
      case '123009':
      case '123010':
      case '123012':
      case '123013':
      case '123014':
      case '123016':
      case '123017':
      case '123018':
      case '123019':
      case '123020':
      case '123021':
      case '123022':
      case '123024':
      case '123030':
      case '123033':
      case '123038':
      case '123045':
      case '123046':
      case '123047':
      case '123048':
      case '123049':
      case '123050':
      case '123051':
      case '123052':
      case '123053':
      case '123054':
      case '123055':
      case '123056':
      case '129002':
      case '129003':
      case '129004':
      case '129005':
      case '129006':
      case '129010':
      case '130003':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Validation,
        }

      case '4004':
      case '123007':
      case '123015':
      case '123035':
      case '123043':
      case '129000':
      case '129015':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Conflict,
        }

      case '123004':
      case '123005':
      case '123011':
      case '123040':
      case '123041':
      case '129001':
      case '130002':
      case '141004':
        return {
          code: ResponseCode.ChannelPlatformWorkNotFound,
          category: PlatformErrorCategory.NotFound,
        }

      case '4012':
      case '123003':
      case '123027':
      case '123034':
      case '123042':
        return {
          code: ResponseCode.ChannelPlatformOperationNotSupported,
          category: PlatformErrorCategory.Unknown,
        }

      case '123006':
      case '129022':
      case '130007':
        return {
          code: ResponseCode.ChannelPlatformMediaProcessingFailed,
          category: PlatformErrorCategory.MediaProcessingFailed,
        }

      case '123028':
        return {
          code: ResponseCode.ChannelPlatformMediaProcessingFailed,
          category: PlatformErrorCategory.MediaProcessingFailed,
          retryable: true,
        }

      case '123029':
      case '123036':
      case '123037':
      case '129009':
      case '129012':
      case '129018':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Quota,
        }

      case '141002':
      case '141003':
      case '141005':
        return {
          code: ResponseCode.ChannelPlatformServiceUnavailable,
          category: PlatformErrorCategory.Timeout,
          retryable: true,
        }

      case '141001':
        return {
          code: ResponseCode.ChannelPlatformApiFailed,
          category: PlatformErrorCategory.Unknown,
        }

      default:
        return undefined
    }
  }

  private static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = BilibiliPlatformException.pathFromUrl(config.url, config.baseURL)
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

  private static codeFromEndpoint(endpoint?: string): ResponseCode {
    if (endpoint?.includes('/refresh_token')) {
      return ResponseCode.ChannelRefreshTokenFailed
    }
    if (endpoint?.includes('/token')) {
      return ResponseCode.ChannelAccessTokenFailed
    }
    if (endpoint?.includes('/video/')
      || endpoint?.includes('/cover/upload')) {
      return ResponseCode.ChannelPlatformMediaProcessingFailed
    }
    return ResponseCode.ChannelPlatformApiFailed
  }

  private static categoryFromEndpoint(endpoint?: string): PlatformErrorCategory {
    if (endpoint?.includes('/token')) {
      return PlatformErrorCategory.Auth
    }
    if (endpoint?.includes('/video/')
      || endpoint?.includes('/cover/upload')) {
      return PlatformErrorCategory.MediaProcessingFailed
    }
    return PlatformErrorCategory.Unknown
  }

  private static categoryFromError(endpoint?: string, status?: number): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }

    const category = BilibiliPlatformException.categoryFromEndpoint(endpoint)
    if (category !== PlatformErrorCategory.Unknown) {
      return category
    }

    return categoryFromHttpStatus(status)
  }

  private static causeTypeFromAxiosError(
    error: AxiosError<BilibiliPlatformResponseBody>,
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
