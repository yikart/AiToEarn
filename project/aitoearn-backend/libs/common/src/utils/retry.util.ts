export interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (error: Error, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: 'linear',
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { maxRetries, delayMs, backoff } = { ...DEFAULT_OPTIONS, ...options }

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      options?.onRetry?.(lastError, attempt)

      if (attempt < maxRetries) {
        const delay = backoff === 'exponential'
          ? delayMs * 2 ** (attempt - 1)
          : delayMs * attempt
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
