import type { AxiosError } from 'axios'
import type { MetaGraphErrorBody } from '../../utils/meta-graph-error.util'
import type { PlatformSpecificExceptionInput, PlatformValidationExceptionInput } from '../platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import {
  categoryFromMetaGraphError,
  isMetaGraphErrorRetryable,
  metaGraphPlatformCode,
} from '../../utils/meta-graph-error.util'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'

export interface InstagramErrorBody extends MetaGraphErrorBody {}

export class InstagramPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Instagram })
  }

  static validation(input: PlatformValidationExceptionInput): InstagramPlatformException {
    return new InstagramPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<InstagramErrorBody>): InstagramPlatformException {
    const response = error.response
    if (!response) {
      return new InstagramPlatformException({
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

    const platformError = response.data?.error
    const platformCode = metaGraphPlatformCode(platformError)
    const category = categoryFromMetaGraphError(
      response.status,
      platformError,
      error.config?.url,
    )

    return new InstagramPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category,
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
        platformMessage: category === PlatformErrorCategory.Quota ? undefined : platformError?.message,
        raw: response.data,
      },
      retryable: isMetaGraphErrorRetryable(response.status, platformError),
    })
  }
}
