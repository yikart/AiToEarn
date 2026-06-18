import { PlatformErrorCategory } from '../platforms/platforms.exception'

export interface MetaGraphError {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  is_transient?: boolean
  error_data?: unknown
  error_user_title?: string
  error_user_msg?: string
  fbtrace_id?: string
}

export interface MetaGraphErrorBody {
  error?: MetaGraphError
}

export function metaGraphPlatformCode(error?: MetaGraphError): number | undefined {
  return error?.code ?? error?.error_subcode
}

export function categoryFromMetaGraphError(
  status: number,
  error?: MetaGraphError,
  endpoint?: string,
): PlatformErrorCategory {
  const code = error?.code
  const subcode = error?.error_subcode

  if (error?.error_subcode === 2207069) {
    return PlatformErrorCategory.Quota
  }
  if (
    code === 190
    || code === 102
    || isMetaAuthSubcode(subcode)
    || (error?.type === 'OAuthException' && code === undefined && subcode === undefined)
    || status === 401
    || (status === 400 && endpoint?.includes('/oauth/'))
  ) {
    return PlatformErrorCategory.Auth
  }
  if (code === 4 || code === 17 || code === 341 || status === 429) {
    return PlatformErrorCategory.RateLimit
  }
  if (code === 3 || code === 10 || isMetaPermissionCode(code) || status === 403) {
    return PlatformErrorCategory.Permission
  }
  if (code === 506 || status === 409) {
    return PlatformErrorCategory.Conflict
  }
  if (code === 100 || code === 1609005 || status === 400 || status === 422) {
    return PlatformErrorCategory.Validation
  }
  if (code === 1 || code === 2 || code === 368 || status >= 500) {
    return PlatformErrorCategory.PlatformUnavailable
  }
  if (status === 404) {
    return PlatformErrorCategory.NotFound
  }
  return PlatformErrorCategory.Unknown
}

export function isMetaGraphErrorRetryable(status: number, error?: MetaGraphError): boolean {
  const code = error?.code
  const category = categoryFromMetaGraphError(status, error)
  if (
    category === PlatformErrorCategory.Auth
    || category === PlatformErrorCategory.Permission
    || category === PlatformErrorCategory.Validation
    || category === PlatformErrorCategory.Conflict
    || category === PlatformErrorCategory.NotFound
    || category === PlatformErrorCategory.Quota
  ) {
    return false
  }
  if (error?.is_transient === true) {
    return true
  }
  if (code === 100) {
    return false
  }
  return status === 408
    || status === 429
    || status >= 500
    || code === 1
    || code === 2
    || code === 4
    || code === 17
    || code === 341
    || code === 368
}

function isMetaAuthSubcode(subcode?: number): boolean {
  return subcode === 458
    || subcode === 459
    || subcode === 460
    || subcode === 463
    || subcode === 464
    || subcode === 467
    || subcode === 492
}

function isMetaPermissionCode(code?: number): boolean {
  return code !== undefined && code >= 200 && code <= 299
}
