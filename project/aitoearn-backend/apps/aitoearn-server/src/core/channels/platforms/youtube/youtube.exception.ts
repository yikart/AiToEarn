import type { AxiosError } from 'axios'
import type { GaxiosError } from 'gaxios'
import type { GoogleApiErrorBody } from '../../utils/google-api-error.util'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import {
  categoryFromGoogleApiError,
  googleApiErrorReason,
  googleApiPlatformCode,
  googleApiPlatformMessage,
  isGoogleApiErrorRetryable,
} from '../../utils/google-api-error.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface YouTubeErrorBody extends GoogleApiErrorBody {}

const invalidCategoryIdMessage = '该 YouTube 分类不可用于发布，请重新选择分类'

export class YouTubePlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.YouTube })
  }

  static validation(input: PlatformValidationExceptionInput): YouTubePlatformException {
    return new YouTubePlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static invalidCategoryId(input: PlatformValidationExceptionInput): YouTubePlatformException {
    return new YouTubePlatformException({
      ...input,
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: 'invalidCategoryId',
        platformMessage: invalidCategoryIdMessage,
      },
      retryable: false,
    })
  }

  static fromAxiosError(error: AxiosError<YouTubeErrorBody>): YouTubePlatformException {
    const response = error.response
    if (!response) {
      return new YouTubePlatformException({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Network,
        context: {
          endpoint: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        },
        cause: {
          type: PlatformErrorCauseType.Network,
          platformMessage: error.message,
          raw: error.toJSON(),
        },
        retryable: true,
      })
    }

    const data = response.data
    const platformCode = googleApiErrorReason(data) ?? googleApiPlatformCode(data)

    return new YouTubePlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: categoryFromGoogleApiError(response.status, data),
      context: {
        endpoint: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      },
      cause: {
        type: platformCode === undefined
          ? PlatformErrorCauseType.Http
          : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode,
        platformMessage: YouTubePlatformException.platformMessage(data),
        raw: data,
      },
      retryable: isGoogleApiErrorRetryable(response.status, data),
    })
  }

  static fromGaxiosError(error: GaxiosError<YouTubeErrorBody>): YouTubePlatformException {
    const response = error.response
    if (!response) {
      return new YouTubePlatformException({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Network,
        context: {
          endpoint: error.config.url?.toString(),
          method: error.config.method?.toUpperCase(),
        },
        cause: {
          type: PlatformErrorCauseType.Network,
          platformMessage: error.message,
          raw: {
            code: error.code,
            status: error.status,
            message: error.message,
          },
        },
        retryable: true,
      })
    }

    const data = response.data
    const platformCode = googleApiErrorReason(data) ?? googleApiPlatformCode(data)

    return new YouTubePlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: categoryFromGoogleApiError(response.status, data),
      context: {
        endpoint: error.config.url?.toString(),
        method: error.config.method?.toUpperCase(),
      },
      cause: {
        type: platformCode === undefined
          ? PlatformErrorCauseType.Http
          : PlatformErrorCauseType.Platform,
        httpStatus: response.status,
        platformCode,
        platformMessage: YouTubePlatformException.platformMessage(data),
        raw: data,
      },
      retryable: isGoogleApiErrorRetryable(response.status, data),
    })
  }

  private static platformMessage(data?: YouTubeErrorBody): string | undefined {
    if (googleApiErrorReason(data) === 'invalidCategoryId') {
      return invalidCategoryIdMessage
    }
    return googleApiPlatformMessage(data)
  }
}
