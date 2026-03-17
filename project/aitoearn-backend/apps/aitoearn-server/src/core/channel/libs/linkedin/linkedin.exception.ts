import { IErrorContext, SocialMediaError } from '../exception'

export interface LinkedInRawError {
  message?: string
  serviceErrorCode?: number
  status?: number
}

/**
 * LinkedIn error class.
 */
export class LinkedInError extends SocialMediaError<LinkedInRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: LinkedInRawError,
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
    return 'linkedin'
  }

  protected static override extractRawError(data: unknown): LinkedInRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as LinkedInRawError
    return errResponse
  }

  protected static override buildMessage(
    rawError: LinkedInRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.message || 'Unknown error'}, error code: ${rawError.serviceErrorCode || 'N/A'}`
  }
}
