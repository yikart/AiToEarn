/**
 * Interface for social media platform errors.
 * All platform error classes must implement this interface.
 */
export enum SocialMediaErrorKind {
  Auth = 'Auth',
  Network = 'Network',
  RateLimit = 'RateLimit',
  Client = 'Client',
  Server = 'Server',
  Unknown = 'Unknown',
}

export type SocialMediaErrorCauseType = 'http' | 'network' | 'platform' | 'unknown'

export interface SocialMediaErrorCause {
  /** Cause type for transport/platform error normalization. */
  readonly type: SocialMediaErrorCauseType

  /** HTTP status from upstream response, if applicable. */
  readonly httpStatus?: number

  /** Normalized platform error code extracted from raw payload. */
  readonly platformCode?: string | number

  /** Normalized platform-facing message extracted from raw payload. */
  readonly platformMessage?: string

  /** Original upstream error or response object. */
  readonly raw?: unknown
}

export interface ISocialMediaError {
  /** Platform name (e.g., 'twitter', 'facebook'). */
  readonly platform: string

  /** Operation name (e.g., 'createPost', 'uploadMedia'). */
  readonly operation: string

  /** Domain-level error category. */
  readonly kind: SocialMediaErrorKind

  /** Error message. */
  readonly message: string

  /** Normalized upstream cause information. */
  readonly cause: SocialMediaErrorCause

  /** Additional request/account context for diagnostics. */
  readonly context?: IErrorContext
}

/**
 * Error context information.
 */
export interface IErrorContext {
  /** Account ID. */
  accountId?: string

  /** Request URL. */
  url?: string

  /** HTTP method. */
  method?: string

  /** Request parameters. */
  params?: Record<string, unknown>

  /** Additional custom information. */
  extra?: Record<string, unknown>
}
