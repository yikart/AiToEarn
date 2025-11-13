import type { IErrorContext, ISocialMediaError } from './interfaces'
import { generateOperation } from './utils'

/**
 * Base class for social media platform errors.
 * Platform-specific error classes extend this and implement abstract methods.
 */
export class SocialMediaError<TPlatformRawError = unknown>
  extends Error
  implements ISocialMediaError {
  readonly platform: string
  readonly operation: string
  readonly status?: number
  readonly rawStatus?: number
  readonly rawError: TPlatformRawError
  readonly isNetworkError: boolean
  readonly context?: IErrorContext

  constructor(
    platform: string,
    operation: string,
    name: string,
    message: string,
    status: number | undefined,
    rawStatus: number | undefined,
    rawError: TPlatformRawError,
    isNetworkError: boolean,
    context?: IErrorContext,
  ) {
    super(message)
    this.name = name
    this.platform = platform
    this.operation = operation
    this.status = status
    this.rawStatus = rawStatus
    this.rawError = rawError
    this.isNetworkError = isNetworkError
    this.context = context

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SocialMediaError)
    }
  }

  /**
   * Builds error from exception (for network errors and unknown errors).
   */
  static buildFromError(
    error: unknown,
    operation?: string,
    context?: IErrorContext,
  ): SocialMediaError {
    if (error instanceof SocialMediaError) {
      return error
    }
    const axiosError = error as {
      isAxiosError?: boolean
      response?: { status?: number, data?: unknown }
      config?: { method?: string, url?: string }
      message?: string
      code?: string
      status?: number
    }

    const isAxios = !!axiosError?.isAxiosError
    if (!isAxios) {
      return this.buildFromUnknownError(error, operation, context)
    }

    const isNetworkError = isAxios && !axiosError?.response
    const finalOperation = operation || this.resolveOperation(axiosError, context)
    if (isNetworkError) {
      const message = `${axiosError?.code || 'NetworkError'}: ${axiosError?.message || 'A network error occurred.'}`
      return this.buildFromNetworkError(
        message,
        finalOperation,
        context,
      )
    }

    const rawStatus = axiosError?.status
    const responseData = axiosError?.response?.data
    const platform = this.getPlatformName()
    const rawError = this.extractRawError(responseData) || {}
    const message = this.buildMessage(rawError, finalOperation)
    const errorName = this.determineErrorName(rawStatus, isNetworkError)

    return new SocialMediaError(
      platform,
      finalOperation,
      errorName,
      message,
      rawStatus,
      rawStatus,
      rawError,
      isNetworkError,
      context,
    )
  }

  static buildFromUnknownError(
    error: unknown,
    operation?: string,
    context?: IErrorContext,
  ): SocialMediaError {
    const unknownError = error as { message?: string }
    const message = `UnknownError: ${unknownError?.message || 'An unknown error occurred.'}`
    return new SocialMediaError(
      this.getPlatformName(),
      operation,
      'UnknownError',
      message,
      undefined,
      undefined,
      {},
      true,
      context,
    )
  }

  /**
   * Builds error specifically for network errors.
   */
  static buildFromNetworkError(
    message: string,
    operation: string,
    context?: IErrorContext,
  ): SocialMediaError {
    const platform = this.getPlatformName()
    return new SocialMediaError(
      platform,
      operation,
      'NetworkError',
      message,
      undefined,
      undefined,
      {},
      true,
      context,
    )
  }

  /**
   * Builds error from API response (for business errors).
   */
  static buildFromResponse<TPlatformRawError = unknown>(
    response: unknown,
    operation?: string,
    context?: IErrorContext,
  ): SocialMediaError {
    const platform = this.getPlatformName()
    const rawError = this.extractRawError(response) || ({} as TPlatformRawError)
    const message = this.buildMessage(rawError, operation)
    const finalOperation = operation || generateOperation(context?.method, context?.url)
    const errorName = this.determineErrorName(400, false)

    return new SocialMediaError(
      platform,
      finalOperation,
      errorName,
      message,
      400,
      200,
      rawError,
      false,
      context,
    )
  }

  /**
   * Resolves operation name from context or axiosError.config.
   */
  static resolveOperation(
    axiosError: { config?: { method?: string, url?: string } },
    context?: IErrorContext,
  ): string {
    if (context?.method && context?.url) {
      return generateOperation(context.method, context.url)
    }
    if (axiosError?.config?.method && axiosError?.config?.url) {
      return generateOperation(axiosError.config.method, axiosError.config.url)
    }
    return 'unknown'
  }

  /**
   * Gets platform name from class name (implemented by subclass or default).
   */
  protected static getPlatformName(): string {
    // Default: 'FacebookError' -> 'facebook'.
    const className = this.name
    return className.replace(/Error$/, '').toLowerCase()
  }

  /**
   * Extracts raw error from data (implemented by subclass).
   */
  protected static extractRawError(_data: unknown): any {
    throw new Error('extractRawError must be implemented by subclass')
  }

  /**
   * Builds error message (implemented by subclass).
   */
  protected static buildMessage(
    _rawError: unknown,
    _operation: string,
  ): string {
    throw new Error('buildMessage must be implemented by subclass')
  }

  /**
   * Determines error name (implemented by subclass).
   */
  protected static determineErrorName(
    status: number | undefined,
    isNetworkError: boolean,
  ): string {
    if (isNetworkError) {
      return 'NetworkError'
    }
    if (!status) {
      return 'UnknownError'
    }
    if (status === 401 || status === 403) {
      return 'AuthError'
    }
    if (status === 429) {
      return 'RateLimitError'
    }
    if (status >= 400 && status < 500) {
      return 'ClientError'
    }
    if (status >= 500) {
      return 'ServerError'
    }
    return 'ApiError'
  }

  /**
   * Converts error to JSON (for logging, serialization, etc.).
   */
  toJSON(): Record<string, unknown> {
    return {
      platform: this.platform,
      operation: this.operation,
      status: this.status,
      rawStatus: this.rawStatus,
      name: this.name,
      message: this.message,
      isNetworkError: this.isNetworkError,
      rawError: this.rawError,
      context: this.context,
    }
  }
}
