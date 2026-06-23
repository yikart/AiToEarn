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

export interface FacebookErrorBody extends MetaGraphErrorBody {}

export class FacebookPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Facebook })
  }

  static validation(input: PlatformValidationExceptionInput): FacebookPlatformException {
    return new FacebookPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<FacebookErrorBody>): FacebookPlatformException {
    const response = error.response
    if (!response) {
      return new FacebookPlatformException({
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

    return new FacebookPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: categoryFromMetaGraphError(
        response.status,
        platformError,
        error.config?.url,
      ),
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
        platformMessage: platformError?.message,
        raw: response.data,
      },
      retryable: isMetaGraphErrorRetryable(response.status, platformError),
    })
  }
}
