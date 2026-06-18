import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { TikTokPublishProvider } from './tiktok-publish.provider'
import { TikTokPublishStatus } from './tiktok.interface'
import { TikTokContentPath, TikTokPostSource, TikTokPrivacyLevel } from './tiktok.schema'
import { TikTokService } from './tiktok.service'

vi.mock('../../media/media.service', () => ({
  MediaService: class MediaService {},
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

function createPublishProvider() {
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
    initVideoPublish: vi.fn(async () => ({ publish_id: 'publish-video-1' })),
    initPhotoPublish: vi.fn(async () => ({ publish_id: 'publish-photo-1' })),
  }
  const provider = new TikTokPublishProvider(
    tikTokService as unknown as TikTokService,
    { pullFromUrlAllowedPrefixes: [] } as never,
    {} as never,
  )
  return { provider, tikTokService }
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

    await provider.publish({
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

  it('keeps publish_id pending when PUBLISH_COMPLETE has no final post id', async () => {
    const { provider } = createProvider({
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
        username: 'creator',
        publishStatus: TikTokPublishStatus.PublishComplete,
      },
    })
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
})
