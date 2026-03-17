import { IErrorContext, SocialMediaError } from '../exception'

export interface TiktokRawError {
  code?: number | string
  message?: string
}

/**
 * Tiktok error class.
 */
export class TiktokError extends SocialMediaError<TiktokRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: TiktokRawError,
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
    return 'tiktok'
  }

  protected static override extractRawError(data: unknown): TiktokRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as { error?: TiktokRawError }
    return errResponse.error
  }

  protected static override buildMessage(
    rawError: TiktokRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.message || 'Unknown error'}, error code: ${rawError.code || 'N/A'}`
  }
}
