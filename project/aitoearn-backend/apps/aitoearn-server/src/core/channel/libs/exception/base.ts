import type { AxiosError } from 'axios'
import type {
  IErrorContext,
  ISocialMediaError,
  SocialMediaErrorCause,
} from './interfaces'
import { AppException, ResponseCode } from '@yikart/common'
import { isAxiosError } from 'axios'
import { SocialMediaErrorKind } from './interfaces'
import { generateOperation } from './utils'

interface SocialMediaErrorInput {
  platform: string
  operation: string
  kind: SocialMediaErrorKind
  cause: SocialMediaErrorCause
  context?: IErrorContext
  code?: number
  message?: string
}

type SocialMediaErrorConstructor<TError extends SocialMediaError = SocialMediaError>
  = (new (input: SocialMediaErrorInput) => TError) & typeof SocialMediaError

/**
 * Base class for social media platform errors.
 * Platform-specific error classes extend this and implement abstract methods.
 */
export class SocialMediaError
  extends AppException
  implements ISocialMediaError {
  readonly platform: string
  readonly operation: string
  readonly kind: SocialMediaErrorKind
  override readonly cause: SocialMediaErrorCause
  readonly context?: IErrorContext

  constructor(input: SocialMediaErrorInput) {
    const message = input.message || SocialMediaError.buildMessage(input.operation, input.cause)
    const code = input.code ?? SocialMediaError.resolveResponseCode(input.kind)

    super(code, message)
    this.name = new.target.name
    this.platform = input.platform
    this.operation = input.operation
    this.kind = input.kind
    this.cause = input.cause
    this.context = input.context

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SocialMediaError)
    }
  }

  /**
   * Builds error from exception (for network errors and unknown errors).
   */
  static buildFromError<TError extends SocialMediaError>(
    this: SocialMediaErrorConstructor<TError>,
    error: unknown,
    operation?: string,
    context?: IErrorContext,
  ): TError {
    if (error instanceof SocialMediaError) {
      return error as TError
    }

    const platform = this.getPlatformName()
    const finalOperation = operation || this.resolveOperation(error, context)

    if (!isAxiosError(error)) {
      return this.buildFromUnknownError(error, finalOperation, context)
    }

    if (!error.response) {
      return this.buildFromNetworkError(error, finalOperation, context)
    }

    const cause = this.buildHttpCause(error)

    return new this({
      platform,
      operation: finalOperation,
      kind: this.resolveKindFromCause(cause),
      context,
      cause,
    })
  }

  static buildFromUnknownError<TError extends SocialMediaError>(
    this: SocialMediaErrorConstructor<TError>,
    error: unknown,
    operation?: string,
    context?: IErrorContext,
  ): TError {
    const cause = this.buildUnknownCause(error)

    return new this({
      platform: this.getPlatformName(),
      operation: operation || 'unknown',
      kind: this.resolveKindFromCause(cause),
      context,
      cause,
    })
  }

  /**
   * Builds error specifically for network errors.
   */
  static buildFromNetworkError<TError extends SocialMediaError>(
    this: SocialMediaErrorConstructor<TError>,
    error: unknown,
    operation: string,
    context?: IErrorContext,
  ): TError {
    const cause = this.buildNetworkCause(error)

    return new this({
      platform: this.getPlatformName(),
      operation,
      kind: this.resolveKindFromCause(cause),
      context,
      cause,
    })
  }

  /**
   * Builds error from API response (for business errors).
   */
  static buildFromResponse<TError extends SocialMediaError>(
    this: SocialMediaErrorConstructor<TError>,
    response: unknown,
    operation?: string,
    context?: IErrorContext,
  ): TError {
    const finalOperation = operation || generateOperation(context?.method, context?.url)
    const cause = this.buildPlatformCause(response)

    return new this({
      platform: this.getPlatformName(),
      operation: finalOperation,
      kind: this.resolveKindFromCause(cause),
      context,
      cause,
    })
  }

  protected static buildHttpCause(error: AxiosError): SocialMediaErrorCause {
    const cause = this.extractPlatformCause(error.response?.data)

    return {
      type: 'http',
      httpStatus: error.response?.status ?? error.status,
      platformCode: cause.platformCode,
      platformMessage: cause.platformMessage || this.resolveRawMessage(error, 'Unknown error'),
      raw: error,
    }
  }

  protected static buildPlatformCause(response: unknown): SocialMediaErrorCause {
    const raw = response
    const data = this.extractPlatformData(response)
    const cause = this.extractPlatformCause(data)

    return {
      type: 'platform',
      platformCode: cause.platformCode,
      platformMessage: cause.platformMessage || 'Unknown error',
      raw,
    }
  }

  protected static buildNetworkCause(error: unknown): SocialMediaErrorCause {
    return {
      type: 'network',
      platformMessage: this.resolveRawMessage(error, 'A network error occurred.'),
      raw: error,
    }
  }

  protected static buildUnknownCause(error: unknown): SocialMediaErrorCause {
    return {
      type: 'unknown',
      platformMessage: this.resolveRawMessage(error, 'An unknown error occurred.'),
      raw: error,
    }
  }

  protected static resolveKindFromCause(
    cause: SocialMediaErrorCause,
  ): SocialMediaErrorKind {
    switch (cause.type) {
      case 'network':
        return SocialMediaErrorKind.Network
      case 'unknown':
        return SocialMediaErrorKind.Unknown
      case 'platform':
        return this.resolveKindFromPlatformCause(cause)
      case 'http':
      default:
        return this.resolveKindFromHttpStatus(cause.httpStatus)
    }
  }

  protected static resolveKindFromPlatformCause(
    _cause: SocialMediaErrorCause,
  ): SocialMediaErrorKind {
    return SocialMediaErrorKind.Client
  }

  protected static resolveKindFromHttpStatus(
    status?: number,
  ): SocialMediaErrorKind {
    if (!status) {
      return SocialMediaErrorKind.Unknown
    }
    if (status === 401 || status === 403) {
      return SocialMediaErrorKind.Auth
    }
    if (status === 429) {
      return SocialMediaErrorKind.RateLimit
    }
    if (status >= 400 && status < 500) {
      return SocialMediaErrorKind.Client
    }
    if (status >= 500) {
      return SocialMediaErrorKind.Server
    }
    return SocialMediaErrorKind.Unknown
  }

  protected static resolveResponseCode(
    kind: SocialMediaErrorKind,
  ): ResponseCode {
    if (kind === SocialMediaErrorKind.Auth) {
      return ResponseCode.ChannelAuthorizationExpired
    }

    return ResponseCode.ChannelAccountInfoFailed
  }

  /**
   * Resolves operation name from context or axiosError.config.
   */
  static resolveOperation(
    error: unknown,
    context?: IErrorContext,
  ): string {
    if (context?.method && context?.url) {
      return generateOperation(context.method, context.url)
    }
    if (isAxiosError(error) && error.config?.method && error.config?.url) {
      return generateOperation(error.config.method, error.config.url)
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
   * Extracts normalized cause data from platform payload (implemented by subclass).
   */
  protected static extractPlatformCause(_data: unknown): Partial<Pick<SocialMediaErrorCause, 'platformCode' | 'platformMessage'>> {
    throw new Error('extractPlatformCause must be implemented by subclass')
  }

  protected static extractPlatformData(data: unknown): unknown {
    if (
      data
      && typeof data === 'object'
      && 'data' in data
      && 'status' in data
      && 'headers' in data
      && 'config' in data
    ) {
      return (data as { data: unknown }).data
    }

    return data
  }

  protected static buildMessage(
    operation: string,
    cause: SocialMediaErrorCause,
  ): string {
    const message = cause.platformMessage || 'Unknown error'
    const code = cause.platformCode === undefined ? '' : `, error code: ${cause.platformCode}`

    return `Failed to ${operation}. ${message}${code}`
  }

  protected static resolveRawMessage(
    raw: unknown,
    fallback: string,
  ): string {
    if (raw instanceof Error) {
      return raw.message || fallback
    }
    if (raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string') {
      return raw.message || fallback
    }

    return fallback
  }

  /**
   * Converts error to JSON (for logging, serialization, etc.).
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      platform: this.platform,
      operation: this.operation,
      kind: this.kind,
      context: this.context,
      cause: this.cause,
    }
  }
}
