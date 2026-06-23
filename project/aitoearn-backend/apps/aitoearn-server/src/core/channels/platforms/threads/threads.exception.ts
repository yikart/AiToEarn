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

export interface ThreadsErrorBody extends MetaGraphErrorBody {}

export class ThreadsPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Threads })
  }

  static validation(input: PlatformValidationExceptionInput): ThreadsPlatformException {
    return new ThreadsPlatformException({
      ...input,
      cause: { type: PlatformErrorCauseType.Validation, ...input.cause },
    })
  }

  static fromAxiosError(error: AxiosError<ThreadsErrorBody>): ThreadsPlatformException {
    const response = error.response
    if (!response) {
      return new ThreadsPlatformException({
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

    return new ThreadsPlatformException({
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
