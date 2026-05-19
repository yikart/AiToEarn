import { AccountType, ResponseCode } from '@yikart/common'
import { PublishType } from '@yikart/mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublishingService } from './publishing.service'

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
  PublishRecordSource: {
    PUBLISH: 'publish',
  },
}))

vi.mock('../../../config', () => ({
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

vi.mock('../../publish-record/publish-record.service', () => ({
  PublishRecordService: class {},
}))

vi.mock('../../../common/utils/file.util', () => ({
  probeRemoteFile: (url: string) => probeRemoteFile(url),
}))

function createService(accountInfo: unknown = {
  id: 'account_1',
  uid: 'uid_1',
  userId: 'user_1',
}) {
  const provider = {
    validatePublishParams: vi.fn().mockResolvedValue({ success: true }),
  }
  const publishRecordService = {
    getByFlowId: vi.fn(),
    createPublishRecord: vi.fn().mockResolvedValue({ id: 'publish_1' }),
  }
  const service = new PublishingService(
    {
      getAccountInfo: vi.fn().mockResolvedValue(accountInfo),
    } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { [AccountType.TWITTER]: provider } as any,
    publishRecordService as any,
    {
      buildUrl: vi.fn((url: string) => url),
    } as any,
  )

  return { service, provider, publishRecordService }
}

describe('publishingService media validation', () => {
  beforeEach(() => {
    probeRemoteFile.mockReset()
  })

  it('账号无效时不会探测媒体 URL', async () => {
    const { service, provider, publishRecordService } = createService(null)

    await expect(service.createPublishingTask({
      accountId: 'missing_account',
      accountType: AccountType.TWITTER,
      type: PublishType.VIDEO,
      videoUrl: 'http://127.0.0.1:8080/private.mp4',
      publishTime: new Date(),
      topics: [],
    } as any)).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountInfoFailed,
    })

    expect(probeRemoteFile).not.toHaveBeenCalled()
    expect(provider.validatePublishParams).not.toHaveBeenCalled()
    expect(publishRecordService.createPublishRecord).not.toHaveBeenCalled()
  })

  it.each([
    'http://127.0.0.1:8080/private.mp4',
    'http://localhost:8080/private.mp4',
  ])('阻断非 FQDN 媒体 URL 且不发起探测：%s', async (videoUrl) => {
    const { service, provider, publishRecordService } = createService()

    await expect(service.createPublishingTask({
      accountId: 'account_1',
      accountType: AccountType.TWITTER,
      type: PublishType.VIDEO,
      videoUrl,
      publishTime: new Date(),
      topics: [],
    } as any)).rejects.toMatchObject({
      code: ResponseCode.PublishResourceUnavailable,
    })

    expect(probeRemoteFile).not.toHaveBeenCalled()
    expect(provider.validatePublishParams).not.toHaveBeenCalled()
    expect(publishRecordService.createPublishRecord).not.toHaveBeenCalled()
  })

  it('创建发布记录前拦截不可访问资源并走 i18n response code', async () => {
    const { service, provider, publishRecordService } = createService()

    probeRemoteFile.mockResolvedValue({
      finalUrl: 'https://assets.example.com/missing.mp4',
      status: 404,
    })

    await expect(service.createPublishingTask({
      accountId: 'account_1',
      accountType: AccountType.TWITTER,
      type: PublishType.VIDEO,
      videoUrl: 'https://assets.example.com/missing.mp4',
      publishTime: new Date(),
      topics: [],
    } as any)).rejects.toMatchObject({
      code: ResponseCode.PublishResourceUnavailable,
    })

    expect(provider.validatePublishParams).not.toHaveBeenCalled()
    expect(publishRecordService.createPublishRecord).not.toHaveBeenCalled()
  })

  it('合法 FQDN 资源可访问后进入平台参数校验和发布记录创建', async () => {
    const { service, provider, publishRecordService } = createService()

    probeRemoteFile.mockResolvedValue({
      finalUrl: 'https://assets.example.com/video.mp4',
      status: 200,
    })

    await service.createPublishingTask({
      accountId: 'account_1',
      accountType: AccountType.TWITTER,
      type: PublishType.VIDEO,
      videoUrl: 'https://assets.example.com/video.mp4',
      publishTime: new Date(Date.now() + 60 * 60 * 1000),
      topics: [],
    } as any)

    expect(probeRemoteFile).toHaveBeenCalledWith('https://assets.example.com/video.mp4')
    expect(provider.validatePublishParams).toHaveBeenCalled()
    expect(publishRecordService.createPublishRecord).toHaveBeenCalled()
  })
})
