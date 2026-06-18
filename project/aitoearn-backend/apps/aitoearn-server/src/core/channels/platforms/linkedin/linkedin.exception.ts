import type { AxiosError } from 'axios'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { categoryFromHttpStatus, isHttpStatusRetryable } from '../../utils/platform-error-classifier.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface LinkedInErrorBody {
  error?: string
  error_description?: string
  message?: string
  status?: number
  serviceErrorCode?: number
  code?: string
}

export class LinkedInPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.LinkedIn })
  }

  static validation(input: PlatformValidationExceptionInput): LinkedInPlatformException {
    return new LinkedInPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<LinkedInErrorBody>): LinkedInPlatformException {
    const response = error.response
    if (!response) {
      return new LinkedInPlatformException({
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
    const platformCode = data?.serviceErrorCode ?? data?.status ?? data?.code ?? data?.error
    const platformMessage = data?.message ?? data?.error_description ?? data?.error

    return new LinkedInPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: categoryFromHttpStatus(response.status),
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
        platformMessage,
        raw: data,
      },
      retryable: isHttpStatusRetryable(response.status),
    })
  }
}
