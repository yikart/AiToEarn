import { describe, expect, it, vi } from 'vitest'
import { TikTokAuthProvider } from './tiktok-auth.provider'

vi.mock('./tiktok.service', () => ({
  TikTokService: class TikTokService {},
}))

function createProvider() {
  const tikTokService = {
    generateAuthUrl: vi.fn(() => 'https://www.tiktok.com/v2/auth/authorize/'),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeAccessToken: vi.fn(),
    getUserInfo: vi.fn(async () => ({
      openId: 'open-id-1',
      unionId: 'union-id-1',
      avatarUrl: 'https://assets.example.test/avatar.jpg',
      username: 'creator',
      displayName: 'Creator',
      bioDescription: 'bio',
      followerCount: 100,
      followingCount: 12,
      likesCount: 300,
      videoCount: 5,
    })),
  }
  const provider = new TikTokAuthProvider(tikTokService as never, {
    scopes: ['user.info.basic', 'user.info.profile', 'user.info.stats'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, tikTokService }
}

describe('tiktok auth provider', () => {
  it('uses the authorized TikTok user as a single account profile with stats', async () => {
    const { provider, tikTokService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).resolves.toEqual({
      platformUid: 'open-id-1',
      account: 'creator',
      displayName: 'Creator',
      avatarUrl: 'https://assets.example.test/avatar.jpg',
      fansCount: 100,
      followingCount: 12,
      raw: {
        openId: 'open-id-1',
        unionId: 'union-id-1',
        username: 'creator',
        bioDescription: 'bio',
        followersCount: 100,
        followingCount: 12,
        likesCount: 300,
        videoCount: 5,
      },
    })
    expect(tikTokService.getUserInfo).toHaveBeenCalledWith('access-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
