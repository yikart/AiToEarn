import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { YoutubeAuthProvider } from './youtube-auth.provider'

vi.mock('./youtube.service', () => ({
  YoutubeService: class YoutubeService {},
}))

function createProvider() {
  const youtubeService = {
    generateAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeAccessToken: vi.fn(),
    getUserInfo: vi.fn(async () => ({
      platformUid: 'google-user-id',
      displayName: 'Google User',
      avatarUrl: 'https://assets.example.test/google.jpg',
      email: 'creator@example.test',
    })),
    listChannelInfo: vi.fn(async () => [
      {
        channelId: 'channel-1',
        title: 'Channel One',
        description: 'A channel',
        thumbnailUrl: 'https://assets.example.test/channel.jpg',
        subscriberCount: 1000,
        videoCount: 12,
        viewCount: 3456,
      },
    ]),
  }
  const provider = new YoutubeAuthProvider(youtubeService as never, {
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, youtubeService }
}

describe('youtube auth provider', () => {
  it('uses authorized YouTube channels as selectable accounts with stats', async () => {
    const { provider, youtubeService } = createProvider()

    await expect(provider.listSelectableAccounts({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scope: 'https://www.googleapis.com/auth/youtube',
    })).resolves.toEqual([{
      platform: AccountType.YouTube,
      platformUid: 'google-user-id',
      account: 'channel-1',
      displayName: 'Channel One',
      avatarUrl: 'https://assets.example.test/channel.jpg',
      fansCount: 1000,
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date('2026-01-01T00:00:00.000Z'),
        scope: 'https://www.googleapis.com/auth/youtube',
      },
      profile: {
        title: 'Channel One',
        description: 'A channel',
        fansCount: 1000,
        videoCount: 12,
        viewCount: 3456,
      },
    }])
    expect(youtubeService.listChannelInfo).toHaveBeenCalledWith('access-token')
    expect(youtubeService.getUserInfo).toHaveBeenCalledWith('access-token')
  })
})
