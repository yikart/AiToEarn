import type { YoutubeOption } from './youtube.schema'
import type { YoutubeService } from './youtube.service'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { YoutubePublishProvider } from './youtube-publish.provider'
import { YoutubePrivacyStatus } from './youtube.schema'

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(),
    },
    youtube: vi.fn(),
  },
}))

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    GooglePlace: 'googlePlace',
    Temp: 'temp',
  },
}))

describe('youtube publish provider validation', () => {
  it('accepts valid content with body topics', async () => {
    const provider = new YoutubePublishProvider({} as YoutubeService)

    const result = await provider.validate({
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description #topic',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
    })

    expect(result).toEqual({ valid: true })
  })

  it('validates the YouTube tag total length from body topics', async () => {
    const provider = new YoutubePublishProvider({} as YoutubeService)

    const result = await provider.validate({
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: `Video description #${'a'.repeat(501)}`,
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      {
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, maximum: 500, unit: 'characters' },
      },
    ]))
  })

  it('strips body topics from description and submits parsed tags', async () => {
    const youtubeService = {
      uploadVideo: vi.fn(async () => ({ videoId: 'video-1' })),
      getVideoDetails: vi.fn(async () => ({
        channelId: 'bound-channel',
        title: 'Video title',
      })),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description #tag',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        containsSyntheticMedia: true,
      },
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: 'video-1',
    })

    expect(youtubeService.uploadVideo).toHaveBeenCalledWith('access-token', expect.objectContaining({
      description: 'Video description',
      tags: ['tag'],
      privacyStatus: YoutubePrivacyStatus.Public,
      containsSyntheticMedia: true,
    }))
  })

  it('ignores legacy option tags and keeps body topics for YouTube tags', async () => {
    const youtubeService = {
      uploadVideo: vi.fn(async () => ({ videoId: 'video-1' })),
      getVideoDetails: vi.fn(async () => ({
        channelId: 'bound-channel',
        title: 'Video title',
      })),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description #bodyTopic',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        tags: ['legacyTag'],
      } as unknown as YoutubeOption,
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })

    expect(youtubeService.uploadVideo).toHaveBeenCalledWith('access-token', expect.objectContaining({
      description: 'Video description',
      tags: ['bodyTopic'],
    }))
  })

  it('uses body topics for YouTube tags when legacy option tags is empty', async () => {
    const youtubeService = {
      uploadVideo: vi.fn(async () => ({ videoId: 'video-1' })),
      getVideoDetails: vi.fn(async () => ({
        channelId: 'bound-channel',
        title: 'Video title',
      })),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description #bodyTopic',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        tags: [],
      } as unknown as YoutubeOption,
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })

    expect(youtubeService.uploadVideo).toHaveBeenCalledWith('access-token', expect.objectContaining({
      description: 'Video description',
      tags: ['bodyTopic'],
    }))
  })

  it('uses body topics when updating YouTube tags', async () => {
    const youtubeService = {
      updateVideo: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.update({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      platformWorkId: 'video-1',
      content: {
        title: 'Video title',
        body: 'Updated description #updatedTopic',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        tags: ['legacyTag'],
      } as unknown as YoutubeOption,
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: 'video-1',
    })

    expect(youtubeService.updateVideo).toHaveBeenCalledWith('access-token', 'video-1', expect.objectContaining({
      description: 'Updated description',
      tags: ['updatedTopic'],
    }))
  })

  it('rejects invalid category ids before uploading media', async () => {
    const youtubeService = {
      listVideoCategories: vi.fn(async () => [{
        id: '18',
        snippet: {
          assignable: false,
        },
      }]),
      uploadVideo: vi.fn(),
      getVideoDetails: vi.fn(),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        categoryId: '18',
      },
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Validation,
      platformCause: {
        platformCode: 'invalidCategoryId',
        platformMessage: '该 YouTube 分类不可用于发布，请重新选择分类',
      },
    })

    expect(youtubeService.listVideoCategories).toHaveBeenCalledWith('access-token', { id: '18' })
    expect(youtubeService.uploadVideo).not.toHaveBeenCalled()
  })

  it('rejects invalid category ids before updating videos', async () => {
    const youtubeService = {
      listVideoCategories: vi.fn(async () => []),
      updateVideo: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.update({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      platformWorkId: 'video-1',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      option: {
        categoryId: '18',
      },
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Validation,
      platformCause: {
        platformCode: 'invalidCategoryId',
      },
    })

    expect(youtubeService.listVideoCategories).toHaveBeenCalledWith('access-token', { id: '18' })
    expect(youtubeService.updateVideo).not.toHaveBeenCalled()
  })

  it('rejects accounts missing the bound YouTube channel before uploading', async () => {
    const youtubeService = {
      uploadVideo: vi.fn(),
      getVideoDetails: vi.fn(),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
      category: PlatformErrorCategory.Auth,
    })

    expect(youtubeService.uploadVideo).not.toHaveBeenCalled()
  })

  it('rejects publish results that land on a different YouTube channel', async () => {
    const youtubeService = {
      uploadVideo: vi.fn(async () => ({ videoId: 'video-1' })),
      getVideoDetails: vi.fn(async () => ({
        channelId: 'other-channel',
        title: 'Video title',
      })),
      setThumbnail: vi.fn(),
    }
    const provider = new YoutubePublishProvider(youtubeService as unknown as YoutubeService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
      credential: {
        accessToken: 'access-token',
        platformUid: 'google-user-id',
        account: 'bound-channel',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformResponseInvalid,
    })

    expect(youtubeService.getVideoDetails).toHaveBeenCalledWith('access-token', 'video-1')
    expect(youtubeService.setThumbnail).not.toHaveBeenCalled()
  })
})
