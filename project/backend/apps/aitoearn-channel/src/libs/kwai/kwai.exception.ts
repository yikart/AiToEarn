import { IErrorContext, SocialMediaError } from '../exception'

export interface KwaiRawError {
  result?: number
  error_msg?: string
}

/**
 * Kwai error class.
 */
export class KwaiError extends SocialMediaError<KwaiRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: KwaiRawError,
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
    return 'kwai'
  }

  protected static override extractRawError(data: unknown): KwaiRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as KwaiRawError
    return errResponse
  }

  protected static override buildMessage(
    rawError: KwaiRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.error_msg || 'Unknown error'}, error code: ${rawError.result || 'N/A'}`
  }
}
