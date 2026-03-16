import { IErrorContext, SocialMediaError } from '../exception'

export interface WxGZHRawError {
  errcode?: number
  errmsg?: string
}

/**
 * WxGZH error class.
 */
export class WxGZHError extends SocialMediaError<WxGZHRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: WxGZHRawError,
    isNetworkError: boolean,
    context: IErrorContext | undefined,
  ) {
    super(
      platform,
      operation,
      name,
      message,
      status,
      rawStatus,
      rawError,
      isNetworkError,
      context,
    )
  }

  protected static override getPlatformName(): string {
    return 'wxgzh'
  }

  protected static override extractRawError(data: unknown): WxGZHRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as WxGZHRawError
    return errResponse
  }

  protected static override buildMessage(
    rawError: WxGZHRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.errmsg || 'Unknown error'}, error code: ${rawError.errcode || 'N/A'}`
  }
}
