import { PostCategory, PostMediaStatus } from '@yikart/channel-db'
import { AccountType } from '@yikart/common'
import { PublishStatus, PublishType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { TiktokPrivacyLevel } from '../../libs/tiktok/tiktok.enum'
import { ThreadsPublishService } from './threads.service'
import { TiktokPubService } from './tiktok.service'
import { TwitterPubService } from './twitter.service'

const probeRemoteFile = vi.fn()

vi.mock('@yikart/channel-db', () => ({
  mongodbConfigSchema: {},
  OAuth2CredentialRepository: class {},
  PostMediaContainerRepository: class {},
  PostCategory: { POST: 'POST', REELS: 'REELS', STORY: 'STORY' },
  PostMediaStatus: { FAILED: -1, CREATED: 0, IN_PROGRESS: 1, FINISHED: 2 },
  PostSubCategory: { PLAINTEXT: 'PLAINTEXT', PHOTO: 'PHOTO', VIDEO: 'VIDEO' },
}))

vi.mock('@yikart/assets', () => ({
  assetsConfigSchema: {},
  AssetsService: class {},
}))

vi.mock('@yikart/mongodb', () => ({
  mongodbConfigSchema: {},
  AccountRepository: class {},
  PublishType: { VIDEO: 'video', ARTICLE: 'article' },
  PublishStatus: {
    FAILED: -1,
    WaitingForPublish: 0,
    PUBLISHED: 1,
    PUBLISHING: 2,
    WAITING_FOR_UPDATE: 3,
    UPDATING: 4,
    UPDATED_FAILED: 5,
  },
}))

vi.mock('../../../../config', () => ({
  config: {
    environment: 'test',
    channel: {
      twitter: {
        pricing: {
          read: { post: 0.5, user: 1, media: 0.5, list: 0.5 },
          write: {
            contentCreate: 1.5,
            contentCreateWithUrl: 20,
            interactionCreate: 1.5,
            interactionDelete: 1,
            contentManage: 0.5,
            bookmark: 0.5,
            mediaMetadata: 0.5,
          },
        },
      },
      tiktok: {},
    },
  },
}))

vi.mock('../../../publish-record/publish-record.service', () => ({
  PublishRecordService: class {},
}))

vi.mock('../../platforms/twitter/twitter-billing.service', () => ({
  TwitterBillingService: class {},
  TwitterWriteChargeType: {
    ContentCreate: 'content_create',
    ContentCreateWithUrl: 'content_create_with_url',
    InteractionCreate: 'interaction_create',
    InteractionDelete: 'interaction_delete',
    ContentManage: 'content_manage',
    Bookmark: 'bookmark',
    MediaMetadata: 'media_metadata',
  },
}))

vi.mock('../../../../common/utils/file.util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../common/utils/file.util')>()
  return {
    ...actual,
    probeRemoteFile: (url: string) => probeRemoteFile(url),
  }
})

describe('publishing providers', () => {
  it('threads 多图发布使用 carousel children 字符串并且子容器不带正文', async () => {
    const threadsService = {
      createItemContainer: vi.fn()
        .mockResolvedValueOnce({ id: 'child_1' })
        .mockResolvedValueOnce({ id: 'child_2' })
        .mockResolvedValueOnce({ id: 'parent_1' }),
      publishPost: vi.fn(),
    }
    const service = new ThreadsPublishService(
      threadsService as any,
      {
        toPresignedUrl: vi.fn(async (url: string) => url),
        buildUrl: vi.fn((url: string) => url),
      } as any,
    )
    const mediaStagingService = {
      createMediaContainer: vi.fn(),
      getMediaContainers: vi.fn().mockResolvedValue([
        { id: 'media_1', status: PostMediaStatus.FINISHED, taskId: 'child_1', category: PostCategory.POST },
        { id: 'media_2', status: PostMediaStatus.FINISHED, taskId: 'child_2', category: PostCategory.POST },
      ]),
    }
    ;(service as any).mediaStagingService = mediaStagingService
    ;(service as any).queueService = {
      addPostMediaTaskJob: vi.fn(),
    }
    ;(service as any).publishRecordService = {
      updateQueueId: vi.fn(),
    }

    const task = {
      id: 'task_1',
      queueId: 'queue_1',
      accountId: 'account_1',
      userId: 'user_1',
      desc: 'hello',
      topics: ['topic'],
      imgUrlList: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      option: {
        threads: {
          location_id: 'location_1',
        },
      },
    } as any

    await service.publishImagePost(task)

    expect(threadsService.createItemContainer).toHaveBeenNthCalledWith(1, 'account_1', {
      media_type: 'IMAGE',
      image_url: 'https://example.com/1.jpg',
      is_carousel_item: true,
    })
    expect(threadsService.createItemContainer).toHaveBeenNthCalledWith(2, 'account_1', {
      media_type: 'IMAGE',
      image_url: 'https://example.com/2.jpg',
      is_carousel_item: true,
    })

    const result = await service.finalizePublish(task)

    expect(threadsService.createItemContainer).toHaveBeenNthCalledWith(3, 'account_1', {
      media_type: 'CAROUSEL',
      children: 'child_1,child_2',
      text: 'hello',
      topic_tag: 'topic',
      location_id: 'location_1',
    })
    expect(result).toMatchObject({ status: PublishStatus.PUBLISHING })
  })

  it('twitter 发布前预检包含发帖费用和 alt text 费用', async () => {
    const billingService = {
      getCreatePostChargeAmount: vi.fn().mockReturnValue(20),
      getWriteChargeAmount: vi.fn().mockReturnValue(0.5),
      ensureSufficientBalance: vi.fn(),
    }
    const service = new TwitterPubService(
      {} as any,
      billingService as any,
      {} as any,
    )

    const result = await service.validatePublishParams({
      accountId: 'account_1',
      accountType: AccountType.TWITTER,
      type: PublishType.ARTICLE,
      desc: 'check https://example.com',
      imgUrlList: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      publishTime: new Date(),
      topics: [],
      option: {
        twitter: {
          mediaMetadata: [
            { altText: 'first image' },
            { altText: '' },
          ],
        },
      },
    } as any)

    expect(result.success).toBe(true)
    expect(billingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 20.5,
    })
  })

  it('twitter 媒体状态缺少 processingInfo 时使用顶层终态', async () => {
    const twitterService = {
      getMediaUploadStatus: vi.fn()
        .mockResolvedValueOnce({ data: { state: 'failed' } })
        .mockResolvedValueOnce({ data: { state: 'succeeded' } })
        .mockResolvedValueOnce({ data: { processingInfo: { state: 'failed' } } }),
    }
    const service = new TwitterPubService(
      twitterService as any,
      {} as any,
      {} as any,
    )

    await expect(service.getMediaProcessingStatus('account_1', 'media_1')).resolves.toBe('failed')
    await expect(service.getMediaProcessingStatus('account_1', 'media_2')).resolves.toBe('succeeded')
    await expect(service.getMediaProcessingStatus('account_1', 'media_3')).resolves.toBe('failed')
  })

  it('tikTok 图文发布把长正文放入 description 并限制 title 长度', async () => {
    probeRemoteFile.mockResolvedValue({
      finalUrl: 'https://example.com/1.jpg',
      status: 206,
      contentType: 'image/jpeg',
    })
    const tiktokService = {
      getCreatorInfoByAccountId: vi.fn().mockResolvedValue({
        privacy_level_options: [TiktokPrivacyLevel.PUBLIC],
        comment_disabled: false,
        duet_disabled: false,
        stitch_disabled: false,
        max_video_post_duration_sec: 600,
      }),
      initPhotoPublishByAccountId: vi.fn().mockResolvedValue({
        publish_id: 'publish_1',
      }),
    }
    const service = new TiktokPubService(
      tiktokService as any,
      {
        buildUrl: vi.fn((url: string) => url),
      } as any,
    )

    await service.publishPhotoViaURL({
      id: 'task_1',
      accountId: 'account_1',
      uid: 'uid_1',
      userId: 'user_1',
      type: PublishType.ARTICLE,
      title: 'T'.repeat(120),
      desc: 'D'.repeat(120),
      topics: ['tag'],
      imgUrlList: ['https://example.com/1.jpg'],
      option: {
        tiktok: {
          privacy_level: TiktokPrivacyLevel.PUBLIC,
        },
      },
    } as any)

    const postInfo = tiktokService.initPhotoPublishByAccountId.mock.calls[0][2]
    expect(postInfo.title).toHaveLength(90)
    expect(postInfo.description).toContain(`${'D'.repeat(120)} #tag`)
    expect(postInfo.description.length).toBeLessThanOrEqual(4000)
  })
})
