import { SetMetadata } from '@nestjs/common'

export interface RedlockOptions {
  key: string | ((...args: unknown[]) => string)
  ttl?: number
  retryDelay?: number
  retryCount?: number
  throwOnFailure?: boolean
}

export const REDLOCK_METADATA = Symbol('REDLOCK_METADATA')

export function Redlock(
  key: string | ((...args: unknown[]) => string),
  // secs
  ttl?: number,
  options?: { retryDelay?: number, retryCount?: number, throwOnFailure?: boolean },
): MethodDecorator {
  const lockOptions: RedlockOptions = {
    key,
    ttl,
    throwOnFailure: true, // 默认抛出错误
    ...(options ?? {}),
  }
  return SetMetadata(REDLOCK_METADATA, lockOptions)
}
