import type { IErrorContext, SocialMediaErrorCause } from '../exception'
import { ApiError } from '@xdevplatform/xdk'
import { SocialMediaError } from '../exception'

export interface TwitterRawError {
  title?: string
  detail?: string
  type?: string
  status?: number
}

export class TwitterError extends SocialMediaError {
  static buildFromApiError(
    error: ApiError,
    operation?: string,
    context?: IErrorContext,
  ): TwitterError {
    if (error.status === 0) {
      return this.buildFromNetworkError(
        error,
        operation || this.resolveOperation(error, context),
        context,
      )
    }

    const extractedCause = this.extractPlatformCause(error.data)
    const cause: SocialMediaErrorCause = {
      type: 'http',
      httpStatus: error.status,
      platformCode: extractedCause.platformCode,
      platformMessage: extractedCause.platformMessage || error.message || 'Unknown error',
      raw: error,
    }

    return new this({
      platform: this.getPlatformName(),
      operation: operation || this.resolveOperation(error, context),
      kind: this.resolveKindFromCause(cause),
      context,
      cause,
    })
  }

  protected static override getPlatformName(): string {
    return 'twitter'
  }

  protected static override extractPlatformCause(
    data: unknown,
  ): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    if (!data || typeof data !== 'object') {
      return {}
    }

    const errResponse = data as {
      errors?: TwitterRawError[]
      error?: string
      error_description?: string
      message?: string
      type?: string
      title?: string
      detail?: string
    }

    return {
      platformCode: errResponse.errors?.[0]?.type || errResponse.type || errResponse.error,
      platformMessage:
        errResponse.errors?.[0]?.title
        || errResponse.errors?.[0]?.detail
        || errResponse.title
        || errResponse.detail
        || errResponse.error_description
        || errResponse.message
        || errResponse.error,
    }
  }
}
