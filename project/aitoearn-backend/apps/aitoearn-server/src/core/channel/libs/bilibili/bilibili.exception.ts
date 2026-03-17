import { IErrorContext, SocialMediaError } from '../exception'

export interface BilibiliRawError {
  message: string
  code: number
}

/**
 * Bilibili error class.
 */
export class BilibiliError extends SocialMediaError<BilibiliRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: BilibiliRawError,
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
    return 'bilibili'
  }

  protected static override extractRawError(data: unknown): BilibiliRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const d = data as Record<string, unknown>
    const errResponse: BilibiliRawError = {
      code: d['code'] as number,
      message: d['message'] as string,
    }
    return errResponse
  }

  protected static override buildMessage(
    rawError: BilibiliRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.message || 'Unknown error'}, error code: ${rawError.code || 'N/A'}`
  }
}
