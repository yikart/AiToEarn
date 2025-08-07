import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'

export function McpCache(key: string, ttl = 60) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    const injectCache = Inject(CACHE_MANAGER)

    descriptor.value = async function (...args: any[]) {
      injectCache(target, 'cacheManager')
      const cacheManager: Cache = this.cacheManager

      const cacheKey = `${key}:${args.join(':')}`
      const cached = await cacheManager.get(cacheKey)

      if (cached) {
        return cached
      }

      const result = await originalMethod.apply(this, args)
      await cacheManager.set(cacheKey, result, ttl * 1000)
      return result
    }

    return descriptor
  }
}
