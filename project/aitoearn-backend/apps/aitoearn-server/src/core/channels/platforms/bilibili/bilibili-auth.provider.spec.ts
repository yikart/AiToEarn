import { describe, expect, it, vi } from 'vitest'
import { BilibiliAuthProvider } from './bilibili-auth.provider'

vi.mock('./bilibili.service', () => ({
  BilibiliService: class BilibiliService {},
}))

function createProvider() {
  const bilibiliService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getUserInfo: vi.fn(async () => ({
      platformUid: 'bilibili-openid',
      displayName: 'Bilibili User',
      avatarUrl: 'https://assets.example.test/bilibili.jpg',
      fansCount: 1200,
      followingCount: 8,
      archiveCount: 33,
    })),
  }
  const provider = new BilibiliAuthProvider(bilibiliService as never, {
    scopes: ['user_info'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, bilibiliService }
}

describe('bilibili auth provider', () => {
  it('uses the authorized Bilibili user as a single account profile', async () => {
    const { provider, bilibiliService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).resolves.toEqual({
      platformUid: 'bilibili-openid',
      displayName: 'Bilibili User',
      avatarUrl: 'https://assets.example.test/bilibili.jpg',
      fansCount: 1200,
      followingCount: 8,
      raw: {
        mid: 'bilibili-openid',
        fansCount: 1200,
        followingCount: 8,
        archiveCount: 33,
      },
    })
    expect(bilibiliService.getUserInfo).toHaveBeenCalledWith('access-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
