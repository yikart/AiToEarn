import { AccountType, ResponseCode } from '@yikart/common'
import { PublishRecordLinkStatus } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { TikTokPublishProvider } from './tiktok-publish.provider'
import { TikTokPublishStatus } from './tiktok.interface'
import { TikTokContentPath, TikTokPostSource, TikTokPrivacyLevel } from './tiktok.schema'
import { TikTokService } from './tiktok.service'

vi.mock('../../media/media.service', () => ({
  MediaService: class MediaService {},
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordLinkStatus: {
    PENDING: 'pending',
    READY: 'ready',
    FAILED: 'failed',
  },
}))

function createProvider(status: Awaited<ReturnType<TikTokService['getPublishStatus']>>) {
  const tikTokService = {
    getPublishStatus: vi.fn(async () => status),
    queryVideos: vi.fn(async () => ({ videos: [] })),
  }
  const provider = new TikTokPublishProvider(
    tikTokService as unknown as TikTokService,
    {} as never,
    {} as never,
  )
  return { provider, tikTokService }
}

function createPublishProvider(input?: {
  config?: { pullFromUrlAllowedPrefixes?: string[] }
  mediaHeaders?: Record<string, string>
}) {
  const tikTokService = {
    getCreatorInfo: vi.fn(async () => ({
      creator_avatar_url: 'https://cdn.example.test/avatar.jpg',
      creator_username: 'creator',
      creator_nickname: 'Creator',
      privacy_level_options: [TikTokPrivacyLevel.Public],
      comment_disabled: false,
      duet_disabled: false,
      stitch_disabled: false,
      max_video_post_duration_sec: 600,
    })),
    getUploadPlan: vi.fn(() => ({
      chunkSize: 10 * 1024 * 1024,
      totalChunkCount: 7,
      ranges: [],
    })),
    initVideoPublish: vi.fn(async () => ({
      publish_id: 'publish-video-1',
      upload_url: 'https://upload.example.test/video',
    })),
    initPhotoPublish: vi.fn(async () => ({ publish_id: 'publish-photo-1' })),
    uploadVideo: vi.fn(async () => undefined),
  }
  const mediaService = {
    head: vi.fn(async () => input?.mediaHeaders ?? { 'content-length': String(70 * 1024 * 1024 + 123) }),
  }
  const provider = new TikTokPublishProvider(
    tikTokService as unknown as TikTokService,
    { pullFromUrlAllowedPrefixes: [], ...(input?.config ?? {}) } as never,
    mediaService as never,
  )
  return { provider, tikTokService, mediaService }
}

describe('tiktok publish provider finalize', () => {
  it('puts video body into title and only sends is_aigc when requested', async () => {
    const { provider, tikTokService } = createPublishProvider()

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        title: 'Title',
        body: 'Body caption',
        media: [{ url: 'https://cdn.example.test/signed-video', metadata: { type: 'video' } }],
      },
      option: {
        source: TikTokPostSource.PullFromUrl,
        is_aigc: true,
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toMatchObject({
      status: 202,
      platformWorkId: 'publish-video-1',
      dataOption: {
        publishId: 'publish-video-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.Public,
        username: 'creator',
      },
    })

    expect(tikTokService.initVideoPublish).toHaveBeenCalledWith(
      'access-token',
      {
        title: 'Title\nBody caption',
        privacy_level: TikTokPrivacyLevel.Public,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        brand_content_toggle: false,
        brand_organic_toggle: false,
        is_aigc: true,
      },
      {
        source: TikTokPostSource.PullFromUrl,
        video_url: 'https://cdn.example.test/signed-video',
      },
    )
  })

  it('does not pass is_aigc to photo publish because the official photo API does not expose it', async () => {
    const { provider, tikTokService } = createPublishProvider()

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        title: 'Photo title',
        body: 'Photo body',
        media: [
          { url: 'https://cdn.example.test/photo-1', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/photo-2', metadata: { type: 'image' } },
        ],
      },
      option: {
        is_aigc: false,
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toMatchObject({
      status: 202,
      platformWorkId: 'publish-photo-1',
      dataOption: {
        publishId: 'publish-photo-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Photo,
        privacyLevel: TikTokPrivacyLevel.Public,
        username: 'creator',
      },
    })

    expect(tikTokService.initPhotoPublish).toHaveBeenCalledWith(
      'access-token',
      expect.objectContaining({
        title: 'Photo title',
        description: 'Photo body',
      }),
      expect.objectContaining({
        photo_images: [
          'https://cdn.example.test/photo-1',
          'https://cdn.example.test/photo-2',
        ],
      }),
    )
    expect(tikTokService.initPhotoPublish.mock.calls[0][1]).not.toHaveProperty('is_aigc')
  })

  it('uses FILE_UPLOAD source to upload external video URLs through TikTok upload_url', async () => {
    const { provider, tikTokService, mediaService } = createPublishProvider()
    const videoUrl = 'https://mcp.example.test/video.mp4'

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        title: 'Title',
        media: [{ url: videoUrl, metadata: { type: 'video' } }],
      },
      option: {
        source: TikTokPostSource.FileUpload,
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toMatchObject({
      status: 202,
      platformWorkId: 'publish-video-1',
      dataOption: {
        publishId: 'publish-video-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.Public,
        username: 'creator',
      },
    })

    expect(mediaService.head).toHaveBeenCalledWith({
      platform: AccountType.TikTok,
      endpoint: 'getVideoSize',
      url: videoUrl,
    })
    expect(tikTokService.initVideoPublish).toHaveBeenCalledWith(
      'access-token',
      expect.objectContaining({
        title: 'Title',
        privacy_level: TikTokPrivacyLevel.Public,
      }),
      {
        source: TikTokPostSource.FileUpload,
        video_size: 70 * 1024 * 1024 + 123,
        chunk_size: 10 * 1024 * 1024,
        total_chunk_count: 7,
      },
    )
    expect(tikTokService.uploadVideo).toHaveBeenCalledWith('https://upload.example.test/video', videoUrl)
  })

  it('rejects PULL_FROM_URL video URLs outside configured TikTok verified prefixes as validation failures', async () => {
    const { provider, tikTokService } = createPublishProvider({
      config: {
        pullFromUrlAllowedPrefixes: ['https://assets.aitoearn.ai/'],
      },
    })

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        title: 'Title',
        media: [{ url: 'https://mcp.example.test/video.mp4', metadata: { type: 'video' } }],
      },
      option: {
        source: TikTokPostSource.PullFromUrl,
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Validation,
    })
    expect(tikTokService.initVideoPublish).not.toHaveBeenCalled()
  })

  it('rejects FILE_UPLOAD source for photo posts because TikTok photo init only supports pull-from-url', async () => {
    const { provider } = createPublishProvider()

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        title: 'Photo title',
        media: [
          { url: 'https://cdn.example.test/photo-1', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/photo-2', metadata: { type: 'image' } },
        ],
      },
      option: {
        source: TikTokPostSource.FileUpload,
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformOperationNotSupported,
      category: PlatformErrorCategory.Validation,
    })
  })

  it('validates extensionless video media by metadata type', async () => {
    const { provider } = createProvider({
      status: TikTokPublishStatus.ProcessingUpload,
    })

    await expect(provider.validate({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        media: [{ url: 'http://cdn.example.test/signed-video', metadata: { type: 'video' } }],
      },
      option: {
        source: TikTokPostSource.PullFromUrl,
      },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({
        code: 'invalid_url',
        path: ['content', 'media', 0, 'url'],
      })],
    })
  })

  it('validates FILE_UPLOAD source as unsupported for photo posts', async () => {
    const { provider } = createPublishProvider()

    await expect(provider.validate({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      accountId: 'account-1',
      content: {
        media: [
          { url: 'https://cdn.example.test/photo-1', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/photo-2', metadata: { type: 'image' } },
        ],
      },
      option: {
        source: TikTokPostSource.FileUpload,
      },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({
        code: 'invalid_option',
        path: ['option', 'source'],
      })],
    })
  })

  it('keeps publish_id pending when PUBLISH_COMPLETE has no final post id', async () => {
    const { provider, tikTokService } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
    })

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      mediaJobs: [],
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.Public,
        username: 'creator',
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toEqual({
      status: 202,
      platformWorkId: 'publish-1',
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.Public,
        username: 'creator',
        publishStatus: TikTokPublishStatus.PublishComplete,
      },
    })
    expect(tikTokService.queryVideos).not.toHaveBeenCalled()
  })

  it('marks private PUBLISH_COMPLETE without final post id as published with pending link', async () => {
    const { provider, tikTokService } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
    })

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      mediaJobs: [],
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.SelfOnly,
        username: 'creator',
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'publish-1',
      linkStatus: PublishRecordLinkStatus.PENDING,
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.SelfOnly,
        username: 'creator',
        publishStatus: TikTokPublishStatus.PublishComplete,
      },
    })
    expect(tikTokService.queryVideos).not.toHaveBeenCalled()
  })

  it('uses finalize option privacy level for old private in-flight records without dataOption privacyLevel', async () => {
    const { provider, tikTokService } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
    })

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      mediaJobs: [],
      option: {
        privacy_level: TikTokPrivacyLevel.SelfOnly,
      },
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Video,
        username: 'creator',
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'publish-1',
      linkStatus: PublishRecordLinkStatus.PENDING,
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.SelfOnly,
        username: 'creator',
        publishStatus: TikTokPublishStatus.PublishComplete,
      },
    })
    expect(tikTokService.queryVideos).not.toHaveBeenCalled()
  })

  it('uses publicaly_available_post_id as final work id and builds canonical permalink', async () => {
    const { provider, tikTokService } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
      publicaly_available_post_id: ['post-1'],
    })
    tikTokService.queryVideos.mockResolvedValue({
      videos: [{ id: 'post-1', share_url: 'https://www.tiktok.com/@creator/photo/post-1' }],
    })

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      mediaJobs: [],
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Photo,
        username: 'creator',
      },
      credential: {
        accessToken: 'access-token',
        account: 'creator',
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'post-1',
      permalink: 'https://www.tiktok.com/@creator/photo/post-1',
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Photo,
        username: 'creator',
        publishStatus: TikTokPublishStatus.PublishComplete,
        finalPostId: 'post-1',
      },
    })
    expect(tikTokService.queryVideos).toHaveBeenCalledWith('access-token', ['post-1'])
  })

  it('does not verify as published when final post id has no canonical link', async () => {
    const { provider } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
      publicaly_available_post_id: ['post-1'],
    })

    await expect(provider.verify({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.PullFromUrl,
        contentPath: TikTokContentPath.Video,
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      published: false,
      platformWorkId: 'post-1',
      permalink: undefined,
    })
  })

  it('verifies private PUBLISH_COMPLETE without final post id as published with pending link', async () => {
    const { provider, tikTokService } = createProvider({
      status: TikTokPublishStatus.PublishComplete,
    })

    await expect(provider.verify({
      taskId: 'task-1',
      platform: AccountType.TikTok,
      platformWorkId: 'publish-1',
      dataOption: {
        publishId: 'publish-1',
        source: TikTokPostSource.FileUpload,
        contentPath: TikTokContentPath.Video,
        privacyLevel: TikTokPrivacyLevel.SelfOnly,
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      published: true,
      platformWorkId: 'publish-1',
      linkStatus: PublishRecordLinkStatus.PENDING,
    })
    expect(tikTokService.queryVideos).not.toHaveBeenCalled()
  })
})
