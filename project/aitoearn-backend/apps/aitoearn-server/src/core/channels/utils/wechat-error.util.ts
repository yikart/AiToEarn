import { PlatformErrorCategory } from '../platforms/platforms.exception'

export function categoryFromWeChatErrCode(errcode?: number): PlatformErrorCategory {
  if (errcode === undefined) {
    return PlatformErrorCategory.Unknown
  }
  if (errcode === -1) {
    return PlatformErrorCategory.PlatformUnavailable
  }
  if (isWeChatAuthErrCode(errcode)) {
    return PlatformErrorCategory.Auth
  }
  if (isWeChatPermissionErrCode(errcode)) {
    return PlatformErrorCategory.Permission
  }
  if (isWeChatRateLimitErrCode(errcode)) {
    return PlatformErrorCategory.RateLimit
  }
  if (isWeChatNotFoundErrCode(errcode)) {
    return PlatformErrorCategory.NotFound
  }
  if (errcode >= 40000 && errcode < 50000) {
    return PlatformErrorCategory.Validation
  }
  return PlatformErrorCategory.Unknown
}

export function isWeChatErrCodeRetryable(errcode?: number): boolean {
  return errcode === -1 || isWeChatRateLimitErrCode(errcode)
}

function isWeChatAuthErrCode(errcode: number): boolean {
  return errcode === 40001
    || errcode === 40013
    || errcode === 40014
    || errcode === 40029
    || errcode === 40030
    || errcode === 42001
    || errcode === 42002
    || errcode === 42007
    || errcode === 61004
}

function isWeChatPermissionErrCode(errcode: number): boolean {
  return errcode === 40164
    || errcode === 48001
    || errcode === 48002
    || errcode === 48004
    || errcode === 48005
}

function isWeChatRateLimitErrCode(errcode?: number): boolean {
  return errcode === 45009
    || errcode === 45011
    || errcode === 45047
    || errcode === 45064
    || errcode === 45065
}

function isWeChatNotFoundErrCode(errcode: number): boolean {
  return errcode === 40003
    || errcode === 40007
    || errcode === 40037
}
