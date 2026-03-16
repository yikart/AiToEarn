import type { IErrorContext } from '../exception/interfaces'
import { SocialMediaError } from '../exception/base'

/**
 * Facebook API raw error format.
 */
export interface FacebookRawError {
  message: string
  type?: string
  code?: number
  fbtrace_id?: string
  error_subcode?: number
  error_user_title?: string
  error_user_msg?: string
}

/**
 * Facebook error class.
 */
export class FacebookError extends SocialMediaError<FacebookRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: FacebookRawError,
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
    return 'facebook'
  }

  protected static override extractRawError(data: unknown): FacebookRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as { error?: FacebookRawError }
    return errResponse.error
  }

  protected static override buildMessage(
    rawError: FacebookRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.error_user_title || rawError.message}, error code: ${rawError.code}`
  }
}
