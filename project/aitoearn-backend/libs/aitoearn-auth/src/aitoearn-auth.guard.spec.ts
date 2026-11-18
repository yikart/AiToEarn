import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { IS_INTERNAL_KEY } from './aitoearn-auth.constants'
import { AitoearnAuthGuard } from './aitoearn-auth.guard'

describe('aitoearnAuthGuard', () => {
  it('accepts the configured internal token on internal routes', async () => {
    const internalToken = 'a'.repeat(40)
    const jwtService = { verifyAsync: vi.fn() }
    const guard = new AitoearnAuthGuard(jwtService as never, {
      secret: 's'.repeat(40),
      internalToken,
      getTokenInfo: vi.fn(),
    } as never)
    const handler = () => undefined
    Reflect.defineMetadata(IS_INTERNAL_KEY, true, handler)
    const context = {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${internalToken}` } }),
      }),
    }

    await expect(guard.canActivate(context as never)).resolves.toBe(true)
    expect(jwtService.verifyAsync).not.toHaveBeenCalled()
  })

  it('rejects an incorrect internal token', async () => {
    const guard = new AitoearnAuthGuard({ verifyAsync: vi.fn() } as never, {
      secret: 's'.repeat(40),
      internalToken: 'a'.repeat(40),
      getTokenInfo: vi.fn(),
    } as never)
    const handler = () => undefined
    Reflect.defineMetadata(IS_INTERNAL_KEY, true, handler)
    const context = {
      getHandler: () => handler,
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${'b'.repeat(40)}` } }),
      }),
    }

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
