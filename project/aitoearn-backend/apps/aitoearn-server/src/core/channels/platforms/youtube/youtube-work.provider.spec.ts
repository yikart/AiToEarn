import type { YoutubeService } from './youtube.service'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { YoutubeWorkProvider } from './youtube-work.provider'

vi.mock('./youtube.service', () => ({
  YoutubeService: class YoutubeService {},
}))

describe('youtube work provider ownership', () => {
  it('requires the video channel to match the bound account channel id', async () => {
    const youtubeService = {
      getVideoDetails: vi.fn(async () => ({
        channelId: 'other-channel',
        title: 'Video title',
      })),
    }
    const provider = new YoutubeWorkProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.verifyOwnership({
      accountId: 'account-1',
      platform: AccountType.YouTube,
      platformWorkId: 'video-1',
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).resolves.toBe(false)

    expect(youtubeService.getVideoDetails).toHaveBeenCalledWith('access-token', 'video-1')
  })
})
