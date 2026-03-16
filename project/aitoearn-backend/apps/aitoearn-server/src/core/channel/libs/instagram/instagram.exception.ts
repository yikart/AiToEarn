import { IErrorContext, SocialMediaError } from '../exception'

export interface InstagramRawError {
  message: string
  type: string
  code: number
  error_subcode?: number
  fbtrace_id?: string
  error_user_msg?: string
  error_user_title?: string
}

/**
 * Instagram error class.
 */
export class InstagramError extends SocialMediaError<InstagramRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: InstagramRawError,
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
    return 'instagram'
  }

  protected static override extractRawError(data: unknown): InstagramRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as { error?: InstagramRawError }
    return errResponse.error
  }

  protected static override buildMessage(
    rawError: InstagramRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.error_user_title || rawError.message}, error code: ${rawError.code}`
  }
}
