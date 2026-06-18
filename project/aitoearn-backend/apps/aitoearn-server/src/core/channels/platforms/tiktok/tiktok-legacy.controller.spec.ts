import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { TikTokLegacyController } from './tiktok-legacy.controller'

vi.mock('../platforms.service', () => ({
  PlatformsService: class PlatformsService {},
}))

function createResponse() {
  return {
    redirect: vi.fn(),
  }
}

describe('tiktok legacy controller', () => {
  it('redirects the legacy auth back query to the channels callback endpoint', () => {
    const controller = new TikTokLegacyController({ dispatchWebhook: vi.fn() } as never)
    const res = createResponse()

    controller.handleAuthBack(
      {
        code: 'code-1',
        state: 'session-1',
        error_description: 'a b',
      },
      res as never,
    )

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      '/api/v2/channels/accounts/auth/tiktok/callback?code=code-1&state=session-1&error_description=a+b',
    )
  })

  it('redirects the legacy auth redirect query to the channels callback endpoint', () => {
    const controller = new TikTokLegacyController({ dispatchWebhook: vi.fn() } as never)
    const res = createResponse()

    controller.handleAuthRedirect(
      {
        error: 'access_denied',
        state: 'session-1',
      },
      res as never,
    )

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      '/api/v2/channels/accounts/auth/tiktok/callback?state=session-1&error=access_denied',
    )
  })

  it('dispatches the legacy webhook route to the TikTok platform webhook handler', async () => {
    const platformsService = {
      dispatchWebhook: vi.fn(async () => undefined),
    }
    const controller = new TikTokLegacyController(platformsService as never)
    const req = { method: 'POST', originalUrl: '/api/plat/tiktok/webhook' }
    const res = {}

    await controller.handleWebhook(req as never, res as never)

    expect(platformsService.dispatchWebhook).toHaveBeenCalledWith(
      AccountType.TikTok,
      req,
      res,
    )
  })
})
