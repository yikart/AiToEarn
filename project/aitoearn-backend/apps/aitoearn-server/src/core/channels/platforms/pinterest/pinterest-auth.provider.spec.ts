import { describe, expect, it, vi } from 'vitest'
import { PinterestAuthProvider } from './pinterest-auth.provider'

function createProvider() {
  const pinterestService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getUser: vi.fn(async () => ({
      platformUid: 'pinterest-user-id',
      displayName: 'Pinterest User',
      avatarUrl: 'https://assets.example.test/pinterest.jpg',
      username: 'pinterest_user',
      followerCount: 120,
      followingCount: 7,
      monthlyViews: 3000,
      pinCount: 18,
    })),
  }
  const provider = new PinterestAuthProvider(pinterestService as never, {
    scopes: ['user_accounts:read'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, pinterestService }
}

describe('pinterest auth provider', () => {
  it('uses the OAuth user as the account and keeps boards out of account selection', async () => {
    const { provider, pinterestService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).resolves.toEqual({
      platformUid: 'pinterest-user-id',
      displayName: 'Pinterest User',
      avatarUrl: 'https://assets.example.test/pinterest.jpg',
      fansCount: 120,
      followingCount: 7,
      raw: {
        username: 'pinterest_user',
        followersCount: 120,
        followingCount: 7,
        monthlyViews: 3000,
        pinCount: 18,
      },
    })
    expect(pinterestService.getUser).toHaveBeenCalledWith('access-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })

  it('treats token revoke failures as best effort', async () => {
    const { provider, pinterestService } = createProvider()
    pinterestService.revokeToken.mockRejectedValueOnce(new Error('revoked already'))

    await expect(provider.revoke({ accessToken: 'access-token' })).resolves.toBeUndefined()
    expect(pinterestService.revokeToken).toHaveBeenCalledWith('access-token')
  })
})
