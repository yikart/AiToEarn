import { UnrecoverableError } from 'bullmq'

/**
 * PublishingException
 * - message: user-facing error summary (safe to display to end users)
 * - details: developer-facing diagnostics (stack, cause, context, etc.)
 */
export class PublishingException extends Error {
  /** Whether the operation can be retried safely */
  readonly retryable: boolean
  /** Developer-facing diagnostics; DO NOT expose directly to clients */
  readonly details?: Record<string, unknown>

  constructor(message: string, retryable: boolean, details?: Record<string, unknown>) {
    super(message)
    this.name = 'PublishingException'
    this.retryable = retryable
    this.details = details
  }

  static retryable(message: string, details?: Record<string, unknown>): PublishingException {
    return new PublishingException(message, true, details)
  }

  static nonRetryable(message: string, details?: Record<string, unknown>): PublishingException {
    return new PublishingException(message, false, details)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    }
  }
}

export function isPublishingException(e: unknown): e is PublishingException {
  return e instanceof PublishingException
}

/**
 * UnrecoverableError wrapper that preserves the original error's cause and stack trace.
 * Used in error-handler.service.ts so that onFailed handlers can log the real origin of failures.
 */
export class PublishingUnrecoverableError extends UnrecoverableError {
  readonly originalStack?: string
  override readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'PublishingUnrecoverableError'
    if (cause instanceof Error) {
      this.cause = cause
      this.originalStack = cause.stack
    }
  }
}
