import { IErrorContext, SocialMediaError } from '../exception'

export interface ThreadsRawError {
  message: string
  type: string
  code: number
  fbtrace_id?: string
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
}

/**
 * Threads error class.
 */
export class ThreadsError extends SocialMediaError<ThreadsRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: ThreadsRawError,
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
    return 'threads'
  }

  protected static override extractRawError(data: unknown): ThreadsRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as { error?: ThreadsRawError }
    return errResponse.error
  }

  protected static override buildMessage(
    rawError: ThreadsRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.error_user_title || rawError.message}, error code: ${rawError.code}`
  }
}
