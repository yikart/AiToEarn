import { SetMetadata } from '@nestjs/common'

export interface RedlockOptions {
  key: string | ((...args: unknown[]) => string)
  ttl?: number
  retryDelay?: number
  retryCount?: number
}

export const REDLOCK_METADATA = Symbol('REDLOCK_METADATA')

export function Redlock(
  key: string | ((...args: unknown[]) => string),
  // secs
  ttl?: number,
  options?: { retryDelay?: number, retryCount?: number },
): MethodDecorator {
  const lockOptions: RedlockOptions = {
    key,
    ttl,
    ...(options ?? {}),
  }
  return SetMetadata(REDLOCK_METADATA, lockOptions)
}
