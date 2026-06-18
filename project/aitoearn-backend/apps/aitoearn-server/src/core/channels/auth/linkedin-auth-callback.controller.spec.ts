import { describe, expect, it, vi } from 'vitest'
import { LinkedInAuthCallbackController } from './linkedin-auth-callback.controller'

function createResponse() {
  return {
    redirect: vi.fn(),
  }
}

describe('linkedin auth callback controller', () => {
  it('redirects the LinkedIn callback query to the channels callback endpoint', () => {
    const controller = new LinkedInAuthCallbackController()
    const res = createResponse()

    controller.handleLinkedInCallback(
      {
        code: 'code-1',
        state: 'session-1',
        error_description: 'a b',
      },
      res as never,
    )

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      '/api/v2/channels/accounts/auth/linkedin/callback?code=code-1&state=session-1&error_description=a+b',
    )
  })
})
