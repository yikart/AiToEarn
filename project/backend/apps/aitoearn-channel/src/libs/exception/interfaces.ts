/**
 * Interface for social media platform errors.
 * All platform error classes must implement this interface.
 */
export interface ISocialMediaError {
  /** Platform name (e.g., 'twitter', 'facebook'). */
  readonly platform: string

  /** Operation name (e.g., 'createPost', 'uploadMedia'). */
  readonly operation: string

  /** Normalized status code for error classification. Undefined for network errors, 400 for HTTP 200 business failures. */
  readonly status?: number

  /** Original HTTP status code from response. Undefined for network errors. */
  readonly rawStatus?: number

  /** Error name/type (e.g., 'NetworkError', 'ApiError', 'ClientError'). */
  readonly name: string

  /** Error message. */
  readonly message: string

  /** Raw error data in platform-specific format. */
  readonly rawError: unknown

  /** Whether this is a network error (connection failure, timeout, DNS resolution failure, etc.). */
  readonly isNetworkError: boolean
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
