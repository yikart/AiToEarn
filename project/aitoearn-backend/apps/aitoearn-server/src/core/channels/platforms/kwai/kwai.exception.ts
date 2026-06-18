import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface KwaiPlatformResponseBody {
  result?: number | string
  error?: string
  error_msg?: string
}

export class KwaiPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Kwai })
  }

  static validation(input: PlatformValidationExceptionInput): KwaiPlatformException {
    return new KwaiPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<KwaiPlatformResponseBody>): KwaiPlatformException {
    const response = error.response
    const body = response?.data
    const platformCode = body?.result
    const endpoint = KwaiPlatformException.endpointFromConfig(response?.config ?? error.config)
    return new KwaiPlatformException({
      code: KwaiPlatformException.codeFromEndpoint(endpoint),
      category: KwaiPlatformException.categoryFromError(endpoint, response?.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: KwaiPlatformException.causeTypeFromAxiosError(error, platformCode),
        httpStatus: response?.status,
        platformCode,
        platformMessage: body?.error_msg ?? error.message,
        raw: body ?? error,
      },
      retryable: response ? isHttpStatusRetryable(response.status) : true,
    })
  }

  static fromPlatformResponse(response: AxiosResponse<KwaiPlatformResponseBody>): KwaiPlatformException {
    const endpoint = KwaiPlatformException.endpointFromConfig(response.config)
    return new KwaiPlatformException({
      code: KwaiPlatformException.codeFromEndpoint(endpoint),
      category: KwaiPlatformException.categoryFromError(endpoint, response.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: response.data.result === undefined ? PlatformErrorCauseType.Http : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode: response.data.result,
        platformMessage: response.data.error_msg,
        raw: response.data,
      },
      retryable: KwaiPlatformException.isRetryablePlatformError(endpoint, response.data),
    })
  }

  static hasPlatformError(response: AxiosResponse<KwaiPlatformResponseBody>): boolean {
    return response.data.result !== undefined && response.data.result !== 1 && response.data.result !== '1'
  }

  private static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = KwaiPlatformException.pathFromUrl(config.url, config.baseURL)
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
    if (endpoint?.includes('/oauth2/refresh_token')) {
      return ResponseCode.ChannelRefreshTokenFailed
    }
    if (endpoint?.includes('/oauth2/')) {
      return ResponseCode.ChannelAccessTokenFailed
    }
    if (endpoint?.includes('/photo/')) {
      return ResponseCode.ChannelPlatformMediaProcessingFailed
    }
    return ResponseCode.ChannelPlatformApiFailed
  }

  private static categoryFromEndpoint(endpoint?: string): PlatformErrorCategory {
    if (endpoint?.includes('/oauth2/')) {
      return PlatformErrorCategory.Auth
    }
    if (endpoint?.includes('/photo/')) {
      return PlatformErrorCategory.MediaProcessingFailed
    }
    return PlatformErrorCategory.Unknown
  }

  private static categoryFromError(endpoint?: string, status?: number): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }

    const category = KwaiPlatformException.categoryFromEndpoint(endpoint)
    if (category !== PlatformErrorCategory.Unknown) {
      return category
    }

    return categoryFromHttpStatus(status)
  }

  private static isRetryablePlatformError(endpoint: string | undefined, body: KwaiPlatformResponseBody): boolean {
    return endpoint === 'GET /openapi/photo/info'
      && body.result === 100120001
      && body.error === 'video_not_exist'
      && body.error_msg === 'VIDEO_NOT_EXIST'
  }

  private static causeTypeFromAxiosError(
    error: AxiosError<KwaiPlatformResponseBody>,
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
