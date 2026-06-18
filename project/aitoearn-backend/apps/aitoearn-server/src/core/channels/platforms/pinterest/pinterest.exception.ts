import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { PinterestOAuthGrantType } from './pinterest.interface'

export interface PinterestErrorBody {
  code?: string | number
  message?: string
  error?: string
  error_description?: string
}

export class PinterestPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Pinterest })
  }

  static validation(input: PlatformValidationExceptionInput): PinterestPlatformException {
    return new PinterestPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<PinterestErrorBody>): PinterestPlatformException {
    const response = error.response
    const endpoint = PinterestPlatformException.endpointFromConfig(response?.config ?? error.config)
    if (!response) {
      return new PinterestPlatformException({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Network,
        context: endpoint ? { endpoint } : undefined,
        cause: {
          type: PlatformErrorCauseType.Network,
          platformMessage: error.message,
          raw: error.toJSON(),
        },
        retryable: true,
      })
    }

    const data = response.data
    const platformCode = data?.code ?? data?.error

    return new PinterestPlatformException({
      code: PinterestPlatformException.codeFromAxiosError(error, endpoint),
      category: PinterestPlatformException.categoryFromError(endpoint, response.status),
      context: endpoint ? { endpoint } : undefined,
      cause: {
        type: platformCode === undefined
          ? PlatformErrorCauseType.Http
          : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode,
        platformMessage: data?.message ?? data?.error_description ?? data?.error,
        raw: data,
      },
      retryable: isHttpStatusRetryable(response.status),
    })
  }

  private static endpointFromConfig(config?: InternalAxiosRequestConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = PinterestPlatformException.pathFromUrl(config.url, config.baseURL)
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

  private static codeFromAxiosError(error: AxiosError<PinterestErrorBody>, endpoint?: string): ResponseCode {
    if (endpoint?.includes('/oauth/token')) {
      return PinterestPlatformException.grantTypeFromRequestData(error.config?.data) === PinterestOAuthGrantType.RefreshToken
        ? ResponseCode.ChannelRefreshTokenFailed
        : ResponseCode.ChannelAccessTokenFailed
    }

    return ResponseCode.ChannelPlatformApiFailed
  }

  private static categoryFromError(endpoint: string | undefined, status?: number): PlatformErrorCategory {
    if (status === undefined) {
      return PlatformErrorCategory.Network
    }
    if (endpoint?.includes('/oauth/token')) {
      return PlatformErrorCategory.Auth
    }

    return categoryFromHttpStatus(status)
  }

  private static grantTypeFromRequestData(data?: string | URLSearchParams): PinterestOAuthGrantType | undefined {
    const grantType = typeof data === 'string'
      ? new URLSearchParams(data).get('grant_type')
      : data?.get('grant_type')
    switch (grantType) {
      case PinterestOAuthGrantType.AuthorizationCode:
      case PinterestOAuthGrantType.RefreshToken:
        return grantType
      default:
        return undefined
    }
  }
}
