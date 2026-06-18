import { describe, expect, it, vi } from 'vitest'
import { ThreadsAuthProvider } from './threads-auth.provider'

function createProvider() {
  const threadsService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    exchangeForLongLivedToken: vi.fn(),
    refreshAccessToken: vi.fn(),
    getUserProfile: vi.fn(async () => ({
      platformUid: 'threads-user-id',
      displayName: 'Threads User',
      username: 'threads_user',
      avatarUrl: 'https://assets.example.test/threads.jpg',
      biography: 'bio',
    })),
    getFollowerCount: vi.fn(async () => 77),
  }
  const provider = new ThreadsAuthProvider(threadsService as never, {
    scopes: ['threads_basic'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, threadsService }
}

describe('threads auth provider', () => {
  it('uses the authorized Threads user as a single account profile', async () => {
    const { provider, threadsService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).resolves.toEqual({
      platformUid: 'threads-user-id',
      account: 'threads_user',
      displayName: 'Threads User',
      avatarUrl: 'https://assets.example.test/threads.jpg',
      fansCount: 77,
      raw: {
        username: 'threads_user',
        biography: 'bio',
        followersCount: 77,
      },
    })
    expect(threadsService.getUserProfile).toHaveBeenCalledWith('access-token')
    expect(threadsService.getFollowerCount).toHaveBeenCalledWith('threads-user-id', 'access-token')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
