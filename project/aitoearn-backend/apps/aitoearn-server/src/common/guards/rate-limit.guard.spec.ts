import { describe, expect, it, vi } from 'vitest'
import { RATE_LIMIT_KEY, RateLimitGuard } from './rate-limit.guard'

describe('rateLimitGuard', () => {
  it('does not use client-controlled forwarding headers for the default key', async () => {
    const redisService = { incrementRateLimit: vi.fn(async () => 1) }
    const guard = new RateLimitGuard(redisService as never)
    const handler = () => undefined
    Reflect.defineMetadata(RATE_LIMIT_KEY, { ttl: 60, limit: 5 }, handler)
    const response = { setHeader: vi.fn() }
    const request = {
      headers: { 'x-forwarded-for': '198.51.100.42', 'x-real-ip': '203.0.113.10' },
      ip: '192.0.2.15',
      route: { path: '/offline-qr' },
    }
    const context = {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    }

    await expect(guard.canActivate(context as never)).resolves.toBe(true)
    expect(redisService.incrementRateLimit).toHaveBeenCalledWith('ip:192.0.2.15:/offline-qr', 60)
  })
})
