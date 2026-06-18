import { describe, expect, it, vi } from 'vitest'
import { TwitterAuthProvider } from './twitter-auth.provider'

vi.mock('./twitter.service', () => ({
  TwitterService: class TwitterService {},
}))

function createProvider() {
  const twitterService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    getUserInfo: vi.fn(async () => ({
      platformUid: 'twitter-user-id',
      displayName: 'X User',
      avatarUrl: 'https://assets.example.test/x.jpg',
      username: 'x_user',
      followersCount: 50,
      followingCount: 6,
      tweetCount: 7,
    })),
  }
  const provider = new TwitterAuthProvider(twitterService as never, {
    scopes: ['tweet.read', 'users.read'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, twitterService }
}

describe('twitter auth provider', () => {
  it('uses the authorized X user as a single account profile with public metrics', async () => {
    const { provider, twitterService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).resolves.toEqual({
      platformUid: 'twitter-user-id',
      account: 'x_user',
      displayName: 'X User',
      avatarUrl: 'https://assets.example.test/x.jpg',
      fansCount: 50,
      followingCount: 6,
      raw: {
        username: 'x_user',
        followersCount: 50,
        followingCount: 6,
        tweetCount: 7,
      },
    })
    expect(twitterService.getUserInfo).toHaveBeenCalledWith('access-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
