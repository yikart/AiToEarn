import { IErrorContext, SocialMediaError } from '../exception'

/**
 * Twitter API 原始错误格式
 */
export interface TwitterRawError {
  title?: string
  detail?: string
  type?: string
  status?: number
}

/**
 * Twitter error class.
 */
export class TwitterError extends SocialMediaError<TwitterRawError> {
  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: TwitterRawError,
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
    return 'twitter'
  }

  protected static override extractRawError(data: unknown): TwitterRawError | undefined {
    if (!data || typeof data !== 'object') {
      return undefined
    }
    const errResponse = data as { errors?: TwitterRawError[] }
    return errResponse.errors ? errResponse.errors[0] : undefined
  }

  protected static override buildMessage(
    rawError: TwitterRawError,
    operation: string,
  ): string {
    return `Failed to ${operation}. ${rawError.title || rawError.detail || 'Unknown error'}, error code: ${rawError.type || 'N/A'}`
  }
}
