import { PlatformErrorCategory } from '../platforms/platforms.exception'

export function categoryFromHttpStatus(status?: number): PlatformErrorCategory {
  if (status === undefined) {
    return PlatformErrorCategory.Unknown
  }
  if (status === 400 || status === 422) {
    return PlatformErrorCategory.Validation
  }
  if (status === 401) {
    return PlatformErrorCategory.Auth
  }
  if (status === 403) {
    return PlatformErrorCategory.Permission
  }
  if (status === 404) {
    return PlatformErrorCategory.NotFound
  }
  if (status === 408) {
    return PlatformErrorCategory.Timeout
  }
  if (status === 409) {
    return PlatformErrorCategory.Conflict
  }
  if (status === 429) {
    return PlatformErrorCategory.RateLimit
  }
  if (status >= 500) {
    return PlatformErrorCategory.PlatformUnavailable
  }
  return PlatformErrorCategory.Unknown
}

export function isHttpStatusRetryable(status?: number): boolean {
  return status === undefined
    || status === 408
    || status === 429
    || (status >= 500)
}

export function isNetworkErrorCode(code?: string): boolean {
  return code === 'ECONNRESET'
    || code === 'ECONNREFUSED'
    || code === 'ETIMEDOUT'
    || code === 'ECONNABORTED'
    || code === 'ENOTFOUND'
    || code === 'EAI_AGAIN'
}
