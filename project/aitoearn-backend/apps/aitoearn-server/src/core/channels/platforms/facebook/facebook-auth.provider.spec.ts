import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { FacebookAuthProvider } from './facebook-auth.provider'

vi.mock('./facebook.service', () => ({
  FacebookService: class FacebookService {},
}))

function createProvider() {
  const facebookService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getFacebookUser: vi.fn(),
    listPages: vi.fn(async () => [
      {
        id: 'page-1',
        name: 'Page One',
        access_token: 'page-token',
        fan_count: 321,
        followers_count: 456,
        picture: {
          data: {
            url: 'https://assets.example.test/page.jpg',
          },
        },
        tasks: ['CREATE_CONTENT'],
        category: 'Creator',
        category_list: [{ id: 'category-1', name: 'Creator' }],
      },
    ]),
  }
  const provider = new FacebookAuthProvider(facebookService as never, {
    scopes: ['pages_show_list'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, facebookService }
}

describe('facebook auth provider', () => {
  it('uses Facebook Page as selectable account with avatar and stats', async () => {
    const { provider, facebookService } = createProvider()

    await expect(provider.listSelectableAccounts({
      accessToken: 'user-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    })).resolves.toEqual([{
      platform: AccountType.Facebook,
      platformUid: 'page-1',
      displayName: 'Page One',
      avatarUrl: 'https://assets.example.test/page.jpg',
      fansCount: 456,
      credential: {
        accessToken: 'page-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      profile: {
        tasks: ['CREATE_CONTENT'],
        category: 'Creator',
        categoryList: [{ id: 'category-1', name: 'Creator' }],
        fansCount: 456,
        fanCount: 321,
        followersCount: 456,
      },
    }])
    expect(facebookService.listPages).toHaveBeenCalledWith('user-token')
  })
})
