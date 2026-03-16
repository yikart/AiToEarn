import { IErrorContext, SocialMediaError } from '../exception'

export interface PinterestRawError {
  message?: string
  code?: number | string
}

/**
 * Pinterest error class.
 */
export class PinterestError extends SocialMediaError<PinterestRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: PinterestRawError,
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
    return 'pinterest'
  }

  protected static override extractRawError(data: unknown): PinterestRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as PinterestRawError
    return errResponse
  }

  protected static override buildMessage(
    rawError: PinterestRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.message || 'Unknown error'}, error code: ${rawError.code || 'N/A'}`
  }
}
