import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { LinkedInAuthProvider } from './linkedin-auth.provider'

vi.mock('./linkedin.service', () => ({
  LinkedInService: class LinkedInService {},
}))

function createProvider() {
  const linkedinService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getProfile: vi.fn(async () => ({
      platformUid: 'member-1',
      displayName: 'Member One',
      avatarUrl: 'https://assets.example.test/member.jpg',
      email: 'member@example.test',
    })),
  }
  const provider = new LinkedInAuthProvider(linkedinService as never, {
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    redirectUri: 'https://api.example.test/api/plat/meta/auth/back',
  } as never)

  return { provider, linkedinService }
}

describe('linkedin auth provider', () => {
  it('uses the configured LinkedIn redirect uri for OAuth URL generation', async () => {
    const { provider, linkedinService } = createProvider()
    linkedinService.generateAuthUrl.mockReturnValue('https://www.linkedin.com/oauth/v2/authorization')

    await expect(provider.generateAuthUrl({
      state: 'session-1',
    })).resolves.toEqual({
      url: 'https://www.linkedin.com/oauth/v2/authorization',
      state: 'session-1',
      redirectUri: 'https://api.example.test/api/plat/meta/auth/back',
    })

    expect(linkedinService.generateAuthUrl).toHaveBeenCalledWith(
      ['openid', 'profile', 'email', 'w_member_social'],
      'session-1',
    )
  })

  it('keeps only the authorized LinkedIn member as a selectable account', async () => {
    const { provider, linkedinService } = createProvider()

    await expect(provider.listSelectableAccounts({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })).resolves.toEqual([
      {
        platform: AccountType.LinkedIn,
        platformUid: 'member-1',
        displayName: 'Member One',
        avatarUrl: 'https://assets.example.test/member.jpg',
        credential: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      },
    ])
    expect(linkedinService.getProfile).toHaveBeenCalledWith('access-token')
  })
})
