import { PlatformErrorCategory } from '../platforms/platforms.exception'
import { categoryFromHttpStatus, isHttpStatusRetryable } from './platform-error-classifier.util'

export interface GoogleApiErrorDetail {
  reason?: string
  message?: string
  domain?: string
  location?: string
  locationType?: string
}

export interface GoogleApiError {
  code?: number
  message?: string
  status?: string
  errors?: GoogleApiErrorDetail[]
}

export interface GoogleApiErrorBody {
  error?: string | GoogleApiError
  error_description?: string
  message?: string
}

export function googleApiPlatformCode(data?: GoogleApiErrorBody): string | number | undefined {
  const error = googleApiErrorObject(data)
  return error?.status
    ?? error?.errors?.[0]?.reason
    ?? error?.code
    ?? (typeof data?.error === 'string' ? data.error : undefined)
}

export function googleApiErrorReason(data?: GoogleApiErrorBody): string | undefined {
  const error = googleApiErrorObject(data)
  return error?.errors?.[0]?.reason
    ?? (typeof data?.error === 'string' ? data.error : undefined)
}

export function googleApiPlatformMessage(data?: GoogleApiErrorBody): string | undefined {
  const error = googleApiErrorObject(data)
  return error?.errors?.[0]?.message
    ?? error?.message
    ?? data?.error_description
    ?? data?.message
    ?? (typeof data?.error === 'string' ? data.error : undefined)
}

export function categoryFromGoogleApiError(
  status?: number,
  data?: GoogleApiErrorBody,
): PlatformErrorCategory {
  const error = googleApiErrorObject(data)
  const apiStatus = error?.status
  const reason = googleApiErrorReason(data)

  if (isGoogleQuotaReason(reason)) {
    return PlatformErrorCategory.Quota
  }
  if (isGoogleRateLimitReason(reason) || apiStatus === 'RESOURCE_EXHAUSTED' || status === 429) {
    return PlatformErrorCategory.RateLimit
  }
  if (
    status === 401
    || data?.error === 'invalid_grant'
    || data?.error === 'invalid_token'
    || data?.error === 'unauthorized_client'
    || data?.error === 'invalid_client'
  ) {
    return PlatformErrorCategory.Auth
  }
  if (apiStatus === 'PERMISSION_DENIED' || status === 403) {
    return PlatformErrorCategory.Permission
  }
  if (apiStatus === 'NOT_FOUND' || status === 404) {
    return PlatformErrorCategory.NotFound
  }
  if (apiStatus === 'ABORTED' || apiStatus === 'ALREADY_EXISTS' || status === 409) {
    return PlatformErrorCategory.Conflict
  }
  if (apiStatus === 'INVALID_ARGUMENT' || apiStatus === 'FAILED_PRECONDITION' || status === 400 || status === 422) {
    return PlatformErrorCategory.Validation
  }
  if (apiStatus === 'UNAVAILABLE' || apiStatus === 'INTERNAL' || status === undefined || status >= 500) {
    return PlatformErrorCategory.PlatformUnavailable
  }
  return categoryFromHttpStatus(status)
}

export function isGoogleApiErrorRetryable(status?: number, data?: GoogleApiErrorBody): boolean {
  const error = googleApiErrorObject(data)
  const apiStatus = error?.status
  const reason = googleApiErrorReason(data)

  if (isGoogleQuotaReason(reason)) {
    return false
  }

  return isGoogleRateLimitReason(reason)
    || apiStatus === 'RESOURCE_EXHAUSTED'
    || apiStatus === 'UNAVAILABLE'
    || apiStatus === 'INTERNAL'
    || isHttpStatusRetryable(status)
}

function googleApiErrorObject(data?: GoogleApiErrorBody): GoogleApiError | undefined {
  return typeof data?.error === 'object' ? data.error : undefined
}

function isGoogleRateLimitReason(reason?: string): boolean {
  return reason === 'rateLimitExceeded'
    || reason === 'userRateLimitExceeded'
}

function isGoogleQuotaReason(reason?: string): boolean {
  return reason === 'quotaExceeded'
    || reason === 'dailyLimitExceeded'
    || reason === 'uploadLimitExceeded'
}
