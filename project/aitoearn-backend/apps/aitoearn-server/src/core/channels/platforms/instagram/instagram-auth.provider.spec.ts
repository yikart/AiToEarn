import { describe, expect, it, vi } from 'vitest'
import { InstagramAuthProvider } from './instagram-auth.provider'
import { InstagramConfig } from './instagram.config'
import { InstagramService } from './instagram.service'

function createProvider() {
  const instagramService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getInstagramUser: vi.fn(async () => ({
      platformUid: 'ig-user-id',
      displayName: 'creator',
      avatarUrl: 'https://assets.example.test/creator.jpg',
      username: 'creator',
      accountType: 'Business',
      followersCount: 120,
      followsCount: 15,
      mediaCount: 8,
    })),
  }
  const config = {
    scopes: ['instagram_business_basic'],
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/instagram/callback',
  }

  return {
    provider: new InstagramAuthProvider(
      instagramService as unknown as InstagramService,
      config as InstagramConfig,
    ),
    instagramService,
  }
}

describe('instagram auth provider', () => {
  it('uses the Instagram Login profile as a single account', async () => {
    const { provider, instagramService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'long-lived-token' })).resolves.toEqual({
      platformUid: 'ig-user-id',
      account: 'creator',
      displayName: 'creator',
      avatarUrl: 'https://assets.example.test/creator.jpg',
      fansCount: 120,
      followingCount: 15,
      raw: {
        username: 'creator',
        accountType: 'Business',
        followersCount: 120,
        followingCount: 15,
        mediaCount: 8,
      },
    })
    expect(instagramService.getInstagramUser).toHaveBeenCalledWith('long-lived-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
