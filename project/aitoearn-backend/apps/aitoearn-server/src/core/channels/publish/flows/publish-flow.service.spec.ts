import { Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import { PublishRecordLinkStatus, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthType, CompletionStrategy, PublishContentMode } from '../../platforms/platforms.interface'
import { PublishValidationField, PublishValidationIssueCode } from '../../platforms/publish.schema'
import { PublishFlowService } from './publish-flow.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class {},
  PublishRecordRepository: class {},
  Transactional: () => () => undefined,
  PublishRecordSource: {
    Web: 'web',
  },
  PublishRecordLinkStatus: {
    PENDING: 'pending',
  },
  PublishStatus: {
    WaitingForPublish: 0,
    Published: 1,
  },
  PublishType: {
    VIDEO: 'video',
    ARTICLE: 'article',
  },
}))

vi.mock('../../media/media.service', () => ({
  MediaService: class {},
}))

function createService() {
  type ServiceDeps = ConstructorParameters<typeof PublishFlowService>
  const publishRecordRepo = {
    listByFlowIdAndUserId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(async data => ({ id: 'record_1', ...data })),
    updateById: vi.fn(),
  }
  const accountRepo = {
    getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'account_1', type: AccountType.Douyin, uid: 'douyin_uid' }),
  }
  const publish = {
    validate: vi.fn().mockResolvedValue({ valid: true }),
    publish: vi.fn().mockResolvedValue({
      status: 200,
      platformWorkId: 'note_1',
      permalink: 'https://www.xiaohongshu.com/explore/note_1',
      dataOption: {
        dataId: 'note_1',
        uniqueId: `${AccountType.RedNote}_note_1`,
      },
    }),
    resolveMediaRules: undefined as undefined | ((input: unknown) => Record<string, unknown>),
  }
  const registry = {
    get: vi.fn().mockReturnValue({
      metadata: {
        contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
        mediaRules: {},
        publishPolicy: {
          completionStrategy: CompletionStrategy.UserHandoff,
          scheduleByPlatform: false,
          updateSupported: false,
        },
      },
      publish,
      runtime: {},
    }),
  }
  const mediaService = {
    preparePublishContentMedia: vi.fn(async ({ content }) => ({ content, issues: [] })),
    validateMedia: vi.fn().mockResolvedValue([]),
  }
  const stateService = {
    markCreated: vi.fn(),
    markCreatedPublished: vi.fn(),
    markQueued: vi.fn(async () => true),
    restoreQueuedToWaiting: vi.fn(async () => true),
  }
  const queueService = {
    enqueueImmediate: vi.fn(),
    enqueueDelayed: vi.fn(),
  }

  const service = new PublishFlowService(
    publishRecordRepo as unknown as ServiceDeps[0],
    accountRepo as unknown as ServiceDeps[1],
    registry as unknown as ServiceDeps[2],
    mediaService as unknown as ServiceDeps[3],
    stateService as unknown as ServiceDeps[4],
    queueService as unknown as ServiceDeps[5],
  )

  return { service, publishRecordRepo, accountRepo, registry, publish, mediaService, stateService, queueService }
}

describe('publish flow service', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-22T09:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists context metadata and keeps image media out of videoUrl', async () => {
    const { service, publishRecordRepo } = createService()

    await service.createFlow('user_1', {
      flowId: 'flow_1',
      content: {
        title: 'title',
        body: 'body #topic #second',
        media: [{ url: 'image-a.jpg' }],
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      context: {
        taskId: 'task_1',
        materialGroupId: 'group_1',
        materialId: 'material_1',
        source: PublishRecordSource.Web,
      },
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })

    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      flowId: 'flow_1',
      type: PublishType.ARTICLE,
      taskId: 'task_1',
      materialGroupId: 'group_1',
      materialId: 'material_1',
      source: PublishRecordSource.Web,
      videoUrl: undefined,
      imgUrlList: ['image-a.jpg'],
      topics: ['topic', 'second'],
      status: PublishStatus.WaitingForPublish,
    }))
  })

  it('persists extensionless media normalized by backend probe as video media', async () => {
    const { service, publishRecordRepo, mediaService } = createService()
    const videoUrl = 'https://assets.example.test/signed-media?token=video'
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: {
        body: 'video body',
        media: [{ url: videoUrl, metadata: { type: 'video' } }],
      },
      issues: [],
    })

    await service.createFlow('user_1', {
      flowId: 'flow_extensionless_video',
      content: {
        body: 'video body',
        media: [{ url: videoUrl }],
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })

    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      flowId: 'flow_extensionless_video',
      type: PublishType.VIDEO,
      videoUrl,
      imgUrlList: [],
    }))
  })

  it('persists item media overrides instead of legacy context media', async () => {
    const { service, publishRecordRepo, accountRepo } = createService()
    const globalVideo = 'https://assets.example.test/global.mp4'
    const globalCover = 'https://assets.example.test/global.jpg'
    const tiktokVideo = 'https://assets.example.test/tiktok.mp4'
    const tiktokCover = 'https://assets.example.test/tiktok.jpg'
    accountRepo.getByIdAndUserId.mockImplementation(async (accountId: string) => ({
      id: accountId,
      type: accountId === 'twitter_account' ? AccountType.Twitter : AccountType.TikTok,
      uid: `${accountId}_uid`,
      account: accountId === 'tiktok_account' ? 'creator' : undefined,
    }))

    await service.createFlow('user_1', {
      flowId: 'flow_platform_overrides',
      content: {
        body: '5555',
        media: [{ url: globalVideo }],
        cover: { url: globalCover },
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      context: {
        type: PublishType.ARTICLE,
        videoUrl: 'https://assets.example.test/wrong-context.mp4',
        imgUrlList: ['https://assets.example.test/wrong-context.jpg'],
        source: PublishRecordSource.Web,
      } as never,
      items: [
        {
          accountId: 'twitter_account',
          platform: AccountType.Twitter,
          overrides: {
            body: '5555',
            media: [{ url: globalVideo }],
            cover: { url: globalCover },
          },
        },
        {
          accountId: 'tiktok_account',
          platform: AccountType.TikTok,
          overrides: {
            body: '1111111111',
            media: [{ url: tiktokVideo }],
            cover: { url: tiktokCover },
          },
        },
      ],
    })

    expect(publishRecordRepo.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      accountId: 'twitter_account',
      accountType: AccountType.Twitter,
      desc: '5555',
      videoUrl: globalVideo,
      imgUrlList: [],
      coverUrl: globalCover,
    }))
    expect(publishRecordRepo.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      accountId: 'tiktok_account',
      accountType: AccountType.TikTok,
      desc: '1111111111',
      videoUrl: tiktokVideo,
      imgUrlList: [],
      coverUrl: tiktokCover,
    }))
  })

  it('rejects content modes not supported by platform metadata before provider validation', async () => {
    const { service, publishRecordRepo, publish } = createService()

    await expect(service.createFlow('user_1', {
      flowId: 'flow_text',
      content: {
        body: 'text only',
        media: [],
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishValidationFailed,
    })

    expect(publish.validate).not.toHaveBeenCalled()
    expect(publishRecordRepo.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate flow ids before plugin publish side effects', async () => {
    const { service, publishRecordRepo, publish } = createService()
    publishRecordRepo.listByFlowIdAndUserId.mockResolvedValueOnce([{ id: 'existing_record' }])

    await expect(service.createFlow('user_1', {
      flowId: 'flow_existing',
      content: {
        body: 'body',
        media: [{ url: 'https://assets.example.test/image.jpg' }],
      },
      items: [{
        accountId: 'account_rednote',
        platform: AccountType.RedNote,
      }],
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishTaskAlreadyExists,
    })

    expect(publish.publish).not.toHaveBeenCalled()
    expect(publishRecordRepo.create).not.toHaveBeenCalled()
  })

  it('rejects mixing relay and local accounts in one publish flow with a stable response code', async () => {
    const { service, accountRepo, publishRecordRepo } = createService()
    accountRepo.getByIdAndUserId.mockImplementation(async (accountId: string) => ({
      id: accountId,
      type: AccountType.Douyin,
      uid: `${accountId}_uid`,
      relayAccountRef: accountId === 'relay_account' ? 'upstream_relay_account' : undefined,
    }))

    await expect(service.createFlow('user_1', {
      flowId: 'flow_mixed_accounts',
      content: {
        body: 'text',
        media: [],
      },
      items: [
        {
          accountId: 'local_account',
          platform: AccountType.Douyin,
        },
        {
          accountId: 'relay_account',
          platform: AccountType.Douyin,
        },
      ],
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishMixedRelayAndLocalAccounts,
    })
    expect(publishRecordRepo.create).not.toHaveBeenCalled()
  })

  it('uses provider-resolved media rules when validating media', async () => {
    const { service, publish, mediaService } = createService()
    const resolvedMediaRules = { videoFormats: ['mp4'], maxVideoDuration: 90 }
    const resolveMediaRules = vi.fn().mockReturnValue(resolvedMediaRules)
    publish.resolveMediaRules = resolveMediaRules

    const content = {
      body: 'video post',
      media: [{ url: 'https://cdn.example.test/video.mp4' }],
    }

    await service.createFlow('user_1', {
      flowId: 'flow_dynamic_media_rules',
      content,
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
        option: { publishTarget: 'reel' },
      }],
    })

    expect(resolveMediaRules).toHaveBeenCalledWith({
      platform: AccountType.Douyin,
      accountId: 'account_1',
      content,
      option: { publishTarget: 'reel' },
    })
    expect(mediaService.validateMedia).toHaveBeenCalledWith(content, resolvedMediaRules)
  })

  it('uses prepared media content for validation and strips adaptation options before provider and record writes', async () => {
    const { service, publish, mediaService, publishRecordRepo } = createService()
    const content = {
      body: 'image post',
      media: [{
        url: 'https://cdn.example.test/source.png',
        options: { adaptation: { imageFormat: 'jpeg' } },
      }],
      cover: {
        url: 'https://cdn.example.test/cover.png',
        options: { adaptation: { imageFormat: 'jpeg' } },
      },
    }
    const preparedContent = {
      ...content,
      media: [{ url: 'https://cdn.example.test/source.jpeg' }],
      cover: { url: 'https://cdn.example.test/cover.jpeg' },
    }
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: preparedContent,
      issues: [],
    })

    await service.createFlow('user_1', {
      flowId: 'flow_media_adaptation',
      content,
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
        option: {
          download_type: 1,
        },
      }],
    })

    expect(mediaService.preparePublishContentMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user_1',
      content,
      mediaRules: {},
      mediaPolicy: undefined,
      cache: expect.any(Map),
    }))
    expect(publish.validate).toHaveBeenCalledWith(expect.objectContaining({
      content: preparedContent,
      option: { download_type: 1 },
    }))
    expect(mediaService.validateMedia).toHaveBeenCalledWith(preparedContent, {})
    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      option: { download_type: 1 },
      imgUrlList: ['https://cdn.example.test/source.jpeg'],
      coverUrl: 'https://cdn.example.test/cover.jpeg',
    }))
  })

  it('fails the flow before provider validation when media preparation reports adaptation issues', async () => {
    const { service, publish, mediaService, publishRecordRepo } = createService()
    const content = {
      body: 'image post',
      media: [{
        url: 'https://cdn.example.test/source.gif',
        options: { adaptation: { imageFormat: 'webp' } },
      }],
    }
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content,
      issues: [{
        code: PublishValidationIssueCode.InvalidOption,
        path: ['content', 'media', 0, 'options', 'adaptation', 'imageFormat'],
        params: { field: PublishValidationField.Option },
      }],
    })

    await expect(service.createFlow('user_1', {
      flowId: 'flow_media_adaptation_failed',
      content,
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishValidationFailed,
    })

    expect(publish.validate).not.toHaveBeenCalled()
    expect(mediaService.validateMedia).not.toHaveBeenCalled()
    expect(publishRecordRepo.create).not.toHaveBeenCalled()
  })

  it('falls back to platform metadata media rules when provider does not resolve them', async () => {
    const { service, registry, publish, mediaService } = createService()
    const metadataMediaRules = { videoFormats: ['mov'], maxVideoDuration: 300 }
    registry.get.mockReturnValue({
      metadata: {
        contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
        mediaRules: metadataMediaRules,
        publishPolicy: {
          completionStrategy: CompletionStrategy.UserHandoff,
          scheduleByPlatform: false,
          updateSupported: false,
        },
      },
      publish,
      runtime: {},
    })
    const content = {
      body: 'video post',
      media: [{ url: 'https://cdn.example.test/video.mov' }],
    }

    await service.createFlow('user_1', {
      flowId: 'flow_metadata_media_rules',
      content,
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })

    expect(mediaService.validateMedia).toHaveBeenCalledWith(content, metadataMediaRules)
  })

  it('throws a permalink-specific error when plugin publish completes without permalink', async () => {
    const { service, publishRecordRepo, accountRepo, registry, publish } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({ id: 'account_rednote', type: AccountType.RedNote, uid: 'rednote_uid' })
    publish.publish.mockResolvedValueOnce({
      status: 200,
      platformWorkId: 'note_1',
    })
    registry.get.mockReturnValue({
      metadata: {
        authType: AuthType.Plugin,
        contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
        mediaRules: {},
        publishPolicy: {
          completionStrategy: CompletionStrategy.Sync,
          scheduleByPlatform: false,
          updateSupported: false,
        },
      },
      publish,
      runtime: {},
    })

    await expect(service.createFlow('user_1', {
      flowId: 'flow_missing_permalink',
      content: {
        body: 'body',
        media: [{ url: 'https://assets.example.test/image.jpg' }],
      },
      items: [{
        accountId: 'account_rednote',
        platform: AccountType.RedNote,
      }],
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishPermalinkMissing,
    })

    expect(publishRecordRepo.create).not.toHaveBeenCalled()
  })

  it('creates RedNote plugin-auth tasks as completed records without queueing', async () => {
    const { service, publishRecordRepo, accountRepo, registry, publish, stateService, queueService } = createService()

    accountRepo.getByIdAndUserId.mockResolvedValue({ id: 'account_rednote', type: AccountType.RedNote, uid: 'rednote_uid' })
    registry.get.mockReturnValue({
      metadata: {
        authType: AuthType.Plugin,
        contentLimits: { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
        mediaRules: {},
        publishPolicy: {
          completionStrategy: CompletionStrategy.Sync,
          scheduleByPlatform: false,
          updateSupported: false,
        },
      },
      publish,
      runtime: {},
    })

    await service.createFlow('user_1', {
      flowId: 'flow_rednote',
      content: {
        media: [],
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      context: {
        source: PublishRecordSource.Web,
      },
      items: [{
        accountId: 'account_rednote',
        platform: AccountType.RedNote,
        option: { workLink: 'https://www.xiaohongshu.com/explore/note_1' },
      }],
    })

    expect(publish.publish).toHaveBeenCalledWith(expect.objectContaining({
      taskId: `flow_rednote_${AccountType.RedNote}_account_rednote`,
      platform: AccountType.RedNote,
      accountId: 'account_rednote',
      option: { workLink: 'https://www.xiaohongshu.com/explore/note_1' },
      credential: {
        accessToken: '',
        platformUid: 'rednote_uid',
      },
    }))
    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'account_rednote',
      accountType: AccountType.RedNote,
      uid: 'rednote_uid',
      source: PublishRecordSource.Web,
      status: PublishStatus.Published,
      platformWorkId: 'note_1',
      dataId: 'note_1',
      uniqueId: `${AccountType.RedNote}_note_1`,
      workLink: 'https://www.xiaohongshu.com/explore/note_1',
    }))
    expect(stateService.markCreatedPublished).toHaveBeenCalledWith('record_1', expect.objectContaining({
      platformWorkId: 'note_1',
      permalink: 'https://www.xiaohongshu.com/explore/note_1',
    }))
    expect(stateService.markQueued).not.toHaveBeenCalled()
    expect(queueService.enqueueImmediate).not.toHaveBeenCalled()
    expect(queueService.enqueueDelayed).not.toHaveBeenCalled()
  })

  it('returns pending link metadata for plugin-auth tasks without a permalink', async () => {
    const { service, publishRecordRepo, accountRepo, registry, publish } = createService()

    accountRepo.getByIdAndUserId.mockResolvedValue({ id: 'account_wx', type: AccountType.WeChatChannels, uid: 'finder_id' })
    publish.publish.mockResolvedValueOnce({
      status: 200,
      platformWorkId: 'media_md5',
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
    })
    registry.get.mockReturnValue({
      metadata: {
        authType: AuthType.Plugin,
        contentLimits: { modes: [PublishContentMode.Video] },
        mediaRules: {},
        publishPolicy: {
          completionStrategy: CompletionStrategy.Sync,
          scheduleByPlatform: false,
          updateSupported: false,
        },
      },
      publish,
      runtime: {},
    })

    await expect(service.createFlow('user_1', {
      flowId: 'flow_wechat_channels',
      content: {
        media: [{ url: 'https://cdn.example.test/video.mp4' }],
      },
      publishAt: new Date('2026-05-23T10:00:00.000Z'),
      items: [{
        accountId: 'account_wx',
        platform: AccountType.WeChatChannels,
      }],
    })).resolves.toMatchObject({
      flowId: 'flow_wechat_channels',
      tasks: [{
        id: 'record_1',
        platform: AccountType.WeChatChannels,
        accountId: 'account_wx',
        status: PublishStatus.Published,
        platformWorkId: 'media_md5',
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
      }],
    })

    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      accountType: AccountType.WeChatChannels,
      platformWorkId: 'media_md5',
      workLink: undefined,
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
    }))
  })

  it('includes link status fields in flow detail tasks', async () => {
    const { service, publishRecordRepo } = createService()
    publishRecordRepo.listByFlowIdAndUserId.mockResolvedValueOnce([{
      id: 'record_1',
      accountId: 'account_wx',
      accountType: AccountType.WeChatChannels,
      status: PublishStatus.Published,
      publishTime: new Date('2026-05-23T10:00:00.000Z'),
      platformWorkId: 'media_md5',
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkError: 'waiting',
      linkMeta: { mediaMd5sum: 'media_md5' },
    }])

    await expect(service.getFlowDetail('user_1', 'flow_wechat_channels')).resolves.toMatchObject({
      flowId: 'flow_wechat_channels',
      tasks: [{
        id: 'record_1',
        accountId: 'account_wx',
        platform: AccountType.WeChatChannels,
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkError: 'waiting',
        linkMeta: { mediaMd5sum: 'media_md5' },
      }],
    })
  })

  it('enqueues local publish records after creating records and state events', async () => {
    const { service, publishRecordRepo, stateService, queueService } = createService()

    await service.createFlow('user_1', {
      flowId: 'flow_immediate',
      content: {
        body: 'video post',
        media: [{ url: 'https://cdn.example.test/video.mp4' }],
      },
      publishAt: new Date('2026-05-22T08:59:00.000Z'),
      items: [{
        accountId: 'account_1',
        platform: AccountType.Douyin,
      }],
    })

    expect(queueService.enqueueImmediate).toHaveBeenCalledWith('record_1')
    expect(publishRecordRepo.create.mock.invocationCallOrder[0]).toBeLessThan(
      queueService.enqueueImmediate.mock.invocationCallOrder[0],
    )
    expect(stateService.markCreated.mock.invocationCallOrder[0]).toBeLessThan(
      queueService.enqueueImmediate.mock.invocationCallOrder[0],
    )
  })

  it('restores queued records and returns the created flow when immediate enqueue fails', async () => {
    const { service, queueService, stateService } = createService()
    queueService.enqueueImmediate.mockRejectedValueOnce(new Error('queue down'))
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    try {
      await expect(service.createFlow('user_1', {
        flowId: 'flow_enqueue_failure',
        content: {
          body: 'video post',
          media: [{ url: 'https://cdn.example.test/video.mp4' }],
        },
        publishAt: new Date('2026-05-22T08:59:00.000Z'),
        items: [{
          accountId: 'account_1',
          platform: AccountType.Douyin,
        }],
      })).resolves.toMatchObject({
        flowId: 'flow_enqueue_failure',
        tasks: [{
          id: 'record_1',
          platform: AccountType.Douyin,
          accountId: 'account_1',
          status: PublishStatus.WaitingForPublish,
        }],
      })

      expect(stateService.restoreQueuedToWaiting).toHaveBeenCalledWith('record_1')
    }
    finally {
      loggerError.mockRestore()
    }
  })
})
