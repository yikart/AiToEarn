import type { AxiosError } from 'axios'
import type { GoogleApiErrorBody } from '../../utils/google-api-error.util'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import {
  categoryFromGoogleApiError,
  googleApiPlatformCode,
  googleApiPlatformMessage,
  isGoogleApiErrorRetryable,
} from '../../utils/google-api-error.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface GoogleBusinessErrorBody extends GoogleApiErrorBody {}

export class GoogleBusinessPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.GoogleBusiness })
  }

  static validation(input: PlatformValidationExceptionInput): GoogleBusinessPlatformException {
    return new GoogleBusinessPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<GoogleBusinessErrorBody>): GoogleBusinessPlatformException {
    const response = error.response
    if (!response) {
      return new GoogleBusinessPlatformException({
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
    const platformCode = googleApiPlatformCode(data)

    return new GoogleBusinessPlatformException({
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
        platformMessage: googleApiPlatformMessage(data),
        raw: data,
      },
      retryable: isGoogleApiErrorRetryable(response.status, data),
    })
  }
}
