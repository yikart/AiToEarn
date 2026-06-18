import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { BilibiliPlatformResponseBody } from '../../platforms/bilibili/bilibili.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { BilibiliPlatformException } from '../../platforms/bilibili/bilibili.exception'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../../platforms/platforms.exception'
import { CompletionStrategy } from '../../platforms/platforms.interface'
import { PublishValidationField, PublishValidationIssueCode } from '../../platforms/publish.schema'
import { PublishTaskService } from './publish-task.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
  PublishRecordRepository: class PublishRecordRepository {},
  Transactional: () => () => undefined,
  PublishStatus: {
    Failed: -1,
    WaitingForPublish: 0,
    Published: 1,
    Publishing: 2,
    WaitingForUpdate: 3,
    Updating: 4,
    UpdatedFailed: 5,
    Queued: 6,
    PlatformScheduled: 7,
    WaitingForUserAction: 8,
    Canceled: 9,
  },
}))

vi.mock('../../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

vi.mock('../../platforms/platforms.registry', () => ({
  PlatformIntegrationRegistry: class PlatformIntegrationRegistry {},
}))

vi.mock('../../media/media.service', () => ({
  MediaService: class MediaService {},
}))

function createService(
  providerOverrides: Record<string, unknown> = {},
  runtimeOverrides: {
    publishPolicy?: {
      completionStrategy?: CompletionStrategy
      scheduleByPlatform?: boolean
      updateSupported?: boolean
    }
    optionSchema?: z.ZodTypeAny
    mediaRules?: Record<string, unknown>
    mediaPolicy?: Record<string, unknown>
  } = {},
) {
  const record = {
    id: 'task-1',
    userId: 'user-1',
    accountId: 'account-1',
    accountType: AccountType.Kwai,
    status: PublishStatus.Publishing,
    platformWorkId: 'work-1',
  }
  const publishRecordRepo = {
    getById: vi.fn(async () => record),
  }
  const accountRepo = {
    getByIdAndUserId: vi.fn(async () => ({
      id: 'account-1',
      type: record.accountType,
      uid: 'platform-user-1',
    })),
  }
  const provider = {
    validate: vi.fn(),
    normalize: vi.fn(),
    publish: vi.fn(),
    finalize: vi.fn(async () => ({
      status: 200,
      platformWorkId: 'work-1',
      permalink: 'https://provider.example.test/work-1',
    })),
    ...providerOverrides,
  }
  const publishPolicy = {
    completionStrategy: CompletionStrategy.Polling,
    scheduleByPlatform: false,
    updateSupported: false,
    ...runtimeOverrides.publishPolicy,
  }
  const registry = {
    get: vi.fn(() => ({
      publish: provider,
      metadata: {
        publishPolicy,
        optionSchema: runtimeOverrides.optionSchema ?? z.object({}),
        mediaRules: runtimeOverrides.mediaRules ?? {},
      },
      runtime: {
        media: runtimeOverrides.mediaPolicy,
      },
    })),
  }
  const authService = {
    getValidCredential: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })),
    markAccountOfflineForCredentialFailure: vi.fn(async () => true),
  }
  const stateService = {
    markPublished: vi.fn(async () => true),
    markFailed: vi.fn(async () => true),
    markFailedAsWaitingForPublish: vi.fn(async () => true),
    markFailedAsPublishing: vi.fn(async () => true),
    markQueuedAsPublishing: vi.fn(async () => true),
    markQueued: vi.fn(async () => true),
    markPublishingRetryQueued: vi.fn(async () => true),
    markPublishingProgress: vi.fn(async () => true),
    markWaitingForUserAction: vi.fn(async () => true),
    restorePublishingToWaiting: vi.fn(async () => true),
    restoreQueuedToWaiting: vi.fn(async () => true),
    markWaitingForUpdate: vi.fn(async () => true),
    markUpdating: vi.fn(async () => true),
    markUpdated: vi.fn(async () => true),
    markUpdatedFailed: vi.fn(async () => true),
    restoreWaitingForUpdate: vi.fn(async () => true),
    restoreRetryStateToFailed: vi.fn(async () => true),
  }
  const queueService = {
    enqueueImmediate: vi.fn(async () => undefined),
    enqueueMediaFinalize: vi.fn(),
    enqueueUpdate: vi.fn(async () => undefined),
  }
  const mediaService = {
    preparePublishContentMedia: vi.fn(async ({ content }) => ({ content, issues: [] })),
    validateMedia: vi.fn(async () => []),
  }

  const service = new PublishTaskService(
    publishRecordRepo as never,
    accountRepo as never,
    registry as never,
    mediaService as never,
    authService as never,
    stateService as never,
    queueService as never,
  )

  return { service, publishRecordRepo, accountRepo, authService, provider, mediaService, stateService, queueService, record }
}

describe('publish task service timeout recovery', () => {
  it('finalizes stale publishing tasks without invoking publish again', async () => {
    const { service, provider, stateService } = createService()

    await service.processPublishingTimeout('task-1')

    expect(provider.publish).not.toHaveBeenCalled()
    expect(provider.finalize).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'task-1',
      platformWorkId: 'work-1',
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        platformUid: 'platform-user-1',
      },
    }))
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'work-1',
      permalink: 'https://provider.example.test/work-1',
      dataOption: undefined,
    })
  })

  it('verifies stale publishing tasks when finalize is unavailable', async () => {
    const { service, provider, stateService } = createService({
      finalize: undefined,
      verify: vi.fn(async () => ({
        published: true,
        platformWorkId: 'verified-work-1',
        permalink: 'https://provider.example.test/verified-work-1',
      })),
    })

    await service.processPublishingTimeout('task-1')

    expect(provider.publish).not.toHaveBeenCalled()
    expect(provider.verify).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'task-1',
      platformWorkId: 'work-1',
    }))
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'verified-work-1',
      permalink: 'https://provider.example.test/verified-work-1',
    })
  })

  it('does not retry or fail stale publishing tasks before a platform work ID is recorded', async () => {
    const { service, provider, stateService, record } = createService()
    record.platformWorkId = ''

    await service.processPublishingTimeout('task-1')

    expect(provider.publish).not.toHaveBeenCalled()
    expect(provider.finalize).not.toHaveBeenCalled()
    expect(stateService.markFailed).not.toHaveBeenCalled()
    expect(stateService.markPublished).not.toHaveBeenCalled()
  })
})

describe('publish task service update', () => {
  it('marks an update failed when the provider returns a failed result', async () => {
    const { service, provider, stateService } = createService({
      update: vi.fn(async () => ({
        status: 400,
        errorMessage: 'provider update failed',
      })),
    }, {
      publishPolicy: { updateSupported: true },
    })

    await service.processUpdateJob('task-1')

    expect(provider.update).toHaveBeenCalled()
    expect(stateService.markUpdated).not.toHaveBeenCalled()
    expect(stateService.markUpdatedFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Unknown,
      message: 'provider update failed',
      retryable: false,
    }))
  })

  it('keeps platform exception details when an update throws', async () => {
    const exception = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.Network,
      cause: {
        type: PlatformErrorCauseType.Network,
        platformMessage: 'socket hang up',
      },
      retryable: true,
    })
    const { service, provider, stateService } = createService({
      update: vi.fn(async () => {
        throw exception
      }),
    }, {
      publishPolicy: { updateSupported: true },
    })

    await service.processUpdateJob('task-1')

    expect(provider.update).toHaveBeenCalled()
    expect(stateService.markUpdatedFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Network,
      code: String(ResponseCode.ChannelPlatformApiFailed),
      originalData: expect.objectContaining({
        platformMessage: 'socket hang up',
      }),
      retryable: true,
    }))
  })
})

describe('publish task service retry', () => {
  it('requeues retryable publish failures instead of failing the task immediately', async () => {
    const retryableError = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.Network,
      cause: {
        type: PlatformErrorCauseType.Network,
        platformMessage: 'socket hang up',
      },
      retryable: true,
    })
    const { service, provider, stateService, queueService, record } = createService({
      publish: vi.fn(async () => {
        throw retryableError
      }),
    })
    record.status = PublishStatus.Queued

    await service.processPublishJob('task-1')

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markPublishingRetryQueued).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Network,
      message: 'KWAI platform API request failed',
      originalData: expect.objectContaining({
        platformMessage: 'socket hang up',
      }),
      retryable: true,
    }))
    expect(stateService.restorePublishingToWaiting).not.toHaveBeenCalled()
    expect(stateService.markQueued).not.toHaveBeenCalled()
    expect(queueService.enqueueImmediate).toHaveBeenCalledWith('task-1', 1)
    expect(stateService.markFailed).not.toHaveBeenCalled()
  })

  it('marks the account offline when publish fails with a non-retryable auth platform error', async () => {
    const authError = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.Auth,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
        platformMessage: 'token invalid',
      },
      retryable: false,
    })
    const { service, provider, authService, stateService, record } = createService({
      publish: vi.fn(async () => {
        throw authError
      }),
    })
    record.status = PublishStatus.Queued

    await service.processPublishJob('task-1')

    expect(provider.publish).toHaveBeenCalled()
    expect(authService.markAccountOfflineForCredentialFailure).toHaveBeenCalledWith(
      'account-1',
      authError,
      'platform_auth_failed',
    )
    expect(stateService.markFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Auth,
      code: String(ResponseCode.ChannelAccessTokenFailed),
      retryable: false,
    }))
  })

  it('rolls publish retries back to waiting when requeue fails', async () => {
    const retryableError = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.Network,
      cause: {
        type: PlatformErrorCauseType.Network,
        platformMessage: 'socket hang up',
      },
      retryable: true,
    })
    const { service, provider, stateService, queueService, record } = createService({
      publish: vi.fn(async () => {
        throw retryableError
      }),
    })
    record.status = PublishStatus.Queued
    queueService.enqueueImmediate.mockRejectedValueOnce(new Error('queue unavailable'))

    await expect(service.processPublishJob('task-1')).rejects.toThrow('queue unavailable')

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markPublishingRetryQueued).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Network,
      retryable: true,
    }))
    expect(queueService.enqueueImmediate).toHaveBeenCalledWith('task-1', 1)
    expect(stateService.restoreQueuedToWaiting).toHaveBeenCalledWith('task-1')
    expect(stateService.markFailed).not.toHaveBeenCalled()
  })

  it('does not treat retryable publish failures as retried when retry state transition fails', async () => {
    const retryableError = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.Network,
      cause: {
        type: PlatformErrorCauseType.Network,
        platformMessage: 'socket hang up',
      },
      retryable: true,
    })
    const { service, provider, stateService, queueService, record } = createService({
      publish: vi.fn(async () => {
        throw retryableError
      }),
    })
    record.status = PublishStatus.Queued
    stateService.markPublishingRetryQueued.mockResolvedValueOnce(false)
    const warn = vi.spyOn(service['logger'], 'warn').mockImplementation(() => undefined)

    await service.processPublishJob('task-1')

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markPublishingRetryQueued).toHaveBeenCalled()
    expect(queueService.enqueueImmediate).not.toHaveBeenCalled()
    expect(stateService.markFailed).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'task-1',
      platform: AccountType.Kwai,
      attempts: 0,
      nextAttempts: 1,
      category: PlatformErrorCategory.Network,
    }), 'Failed to queue retryable publish task')
    warn.mockRestore()
  })

  it('requeues retryable finalize failures instead of failing the task immediately', async () => {
    const retryableError = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.MediaProcessingFailed,
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: 100120001,
        platformMessage: 'VIDEO_NOT_EXIST',
      },
      retryable: true,
    })
    const { service, provider, stateService, queueService } = createService({
      finalize: vi.fn(async () => {
        throw retryableError
      }),
    })

    await service.processFinalizeJob('task-1')

    expect(provider.finalize).toHaveBeenCalled()
    expect(queueService.enqueueMediaFinalize).toHaveBeenCalledWith('task-1', 30 * 1000, 1)
    expect(stateService.markFailed).not.toHaveBeenCalled()
  })

  it('does not swallow retryable finalize requeue failures', async () => {
    const retryableError = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      platform: AccountType.Kwai,
      category: PlatformErrorCategory.MediaProcessingFailed,
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: 100120001,
        platformMessage: 'VIDEO_NOT_EXIST',
      },
      retryable: true,
    })
    const { service, stateService, queueService } = createService({
      finalize: vi.fn(async () => {
        throw retryableError
      }),
    })
    queueService.enqueueMediaFinalize.mockRejectedValueOnce(new Error('queue unavailable'))

    await expect(service.processFinalizeJob('task-1')).rejects.toThrow('queue unavailable')

    expect(stateService.markFailed).not.toHaveBeenCalled()
  })

  it('retries failed submitted tasks through finalize without publishing again', async () => {
    const { service, provider, stateService, queueService, record } = createService()
    record.status = PublishStatus.Failed
    record.platformWorkId = 'photo-1'
    Object.assign(record, {
      errorMsg: 'VIDEO_NOT_EXIST',
      errorData: { type: 'media_processing_failed', code: '15074', message: 'VIDEO_NOT_EXIST' },
    })

    await service.retryTask('user-1', 'task-1')

    expect(provider.publish).not.toHaveBeenCalled()
    expect(provider.finalize).not.toHaveBeenCalled()
    expect(stateService.markFailedAsPublishing).toHaveBeenCalledWith('task-1')
    expect(queueService.enqueueMediaFinalize).toHaveBeenCalledWith('task-1')
    expect(stateService.markFailedAsWaitingForPublish).not.toHaveBeenCalled()
    expect(queueService.enqueueImmediate).not.toHaveBeenCalled()
  })

  it('retries failed tasks without platform work id through publish queue', async () => {
    const { service, stateService, queueService, record } = createService()
    record.status = PublishStatus.Failed
    record.platformWorkId = ''

    await service.retryTask('user-1', 'task-1')

    expect(stateService.markFailedAsWaitingForPublish).toHaveBeenCalledWith('task-1')
    expect(stateService.markQueued).toHaveBeenCalledWith('task-1')
    expect(queueService.enqueueImmediate).toHaveBeenCalledWith('task-1')
    expect(stateService.markFailedAsPublishing).not.toHaveBeenCalled()
    expect(queueService.enqueueMediaFinalize).not.toHaveBeenCalled()
  })

  it('rejects retry for non-failed tasks', async () => {
    const { service, stateService, queueService, record } = createService()
    record.status = PublishStatus.Published

    await expect(service.retryTask('user-1', 'task-1')).rejects.toThrow()

    expect(stateService.markFailedAsWaitingForPublish).not.toHaveBeenCalled()
    expect(stateService.markFailedAsPublishing).not.toHaveBeenCalled()
    expect(queueService.enqueueImmediate).not.toHaveBeenCalled()
    expect(queueService.enqueueMediaFinalize).not.toHaveBeenCalled()
  })

  it('rejects retry for submitted tasks when the platform has no finalize support', async () => {
    const { service, stateService, queueService, record } = createService({
      finalize: undefined,
    })
    record.status = PublishStatus.Failed
    record.platformWorkId = 'work-1'

    await expect(service.retryTask('user-1', 'task-1')).rejects.toThrow()

    expect(stateService.markFailedAsPublishing).not.toHaveBeenCalled()
    expect(queueService.enqueueMediaFinalize).not.toHaveBeenCalled()
  })

  it('restores failed task state when retry enqueue fails', async () => {
    const { service, stateService, queueService, record } = createService()
    record.status = PublishStatus.Failed
    record.platformWorkId = 'photo-1'
    Object.assign(record, {
      errorMsg: 'VIDEO_NOT_EXIST',
      errorData: { type: 'media_processing_failed', code: '15074', message: 'VIDEO_NOT_EXIST' },
    })
    queueService.enqueueMediaFinalize.mockRejectedValueOnce(new Error('queue unavailable'))

    await expect(service.retryTask('user-1', 'task-1')).rejects.toThrow('queue unavailable')

    expect(stateService.restoreRetryStateToFailed).toHaveBeenCalledWith('task-1', {
      errorMsg: 'VIDEO_NOT_EXIST',
      errorData: { type: 'media_processing_failed', code: '15074', message: 'VIDEO_NOT_EXIST' },
    })
  })
})

describe('publish task service publish result polling', () => {
  it('does not enqueue finalize polling for synchronous completed publishes', async () => {
    const { service, provider, stateService, queueService, record } = createService(
      {
        publish: vi.fn(async () => ({
          status: 200,
          platformWorkId: 'work-1',
          permalink: 'https://provider.example.test/work-1',
        })),
      },
      {
        publishPolicy: { completionStrategy: CompletionStrategy.Sync },
      },
    )
    record.status = PublishStatus.Queued

    await service.processPublishJob('task-1')

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'work-1',
      permalink: 'https://provider.example.test/work-1',
      dataOption: undefined,
      originalWorkLink: undefined,
      workStatus: undefined,
    })
    expect(queueService.enqueueMediaFinalize).not.toHaveBeenCalled()
  })

  it('enqueues Douyin user action finalize polling after handoff publish', async () => {
    const expiresAt = new Date('2999-01-01T00:00:00.000Z')
    const { service, provider, stateService, queueService, record } = createService(
      {
        publish: vi.fn(async () => ({
          status: 202,
          platformWorkId: 'share_1',
          userAction: {
            schema: 'snssdk1128://openplatform/share?state=share_1',
            shortLink: 'https://s.example.test/share_1',
            expiresAt,
            data: { shareId: 'share_1' },
          },
          dataOption: {
            shareId: 'share_1',
            expiresAt: expiresAt.toISOString(),
          },
        })),
      },
      {
        publishPolicy: { completionStrategy: CompletionStrategy.UserHandoff },
      },
    )
    record.status = PublishStatus.Queued
    record.accountType = AccountType.Douyin

    await service.processPublishJob('task-1')

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markWaitingForUserAction).toHaveBeenCalledWith('task-1', expect.objectContaining({
      platformWorkId: 'share_1',
      dataOption: {
        shareId: 'share_1',
        expiresAt: expiresAt.toISOString(),
      },
    }))
    expect(queueService.enqueueMediaFinalize).toHaveBeenCalledWith('task-1', 30 * 1000)
  })

  it('keeps Douyin user action waiting while only item_id is available', async () => {
    const { service, provider, stateService, queueService, record } = createService(
      {
        finalize: vi.fn(async () => ({
          status: 202,
          platformWorkId: 'share_1',
          dataOption: {
            shareId: 'share_1',
            itemId: 'item_1',
            expiresAt: '2999-01-01T00:00:00.000Z',
          },
        })),
      },
      {
        publishPolicy: { completionStrategy: CompletionStrategy.UserHandoff },
      },
    )
    record.status = PublishStatus.WaitingForUserAction
    record.accountType = AccountType.Douyin
    record.platformWorkId = 'share_1'
    record.dataOption = {
      shareId: 'share_1',
      expiresAt: '2999-01-01T00:00:00.000Z',
    }

    await service.processFinalizeJob('task-1', 3)

    expect(provider.finalize).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'task-1',
      platformWorkId: 'share_1',
      dataOption: {
        shareId: 'share_1',
        expiresAt: '2999-01-01T00:00:00.000Z',
      },
    }))
    expect(stateService.markWaitingForUserAction).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'share_1',
      dataOption: {
        shareId: 'share_1',
        itemId: 'item_1',
        expiresAt: '2999-01-01T00:00:00.000Z',
      },
    })
    expect(queueService.enqueueMediaFinalize).toHaveBeenCalledWith('task-1', 30 * 1000, 4)
    expect(stateService.markPublished).not.toHaveBeenCalled()
  })

  it('marks Douyin user action published when fallback polling returns video_id', async () => {
    const { service, stateService, record } = createService(
      {
        finalize: vi.fn(async () => ({
          status: 200,
          platformWorkId: 'video_1',
          permalink: 'https://www.douyin.com/video/video_1',
          dataOption: {
            shareId: 'share_1',
            itemId: 'item_1',
            videoId: 'video_1',
            workLink: 'https://www.douyin.com/video/video_1',
          },
        })),
      },
      {
        publishPolicy: { completionStrategy: CompletionStrategy.UserHandoff },
      },
    )
    record.status = PublishStatus.WaitingForUserAction
    record.accountType = AccountType.Douyin
    record.platformWorkId = 'share_1'
    record.dataOption = {
      shareId: 'share_1',
      expiresAt: '2999-01-01T00:00:00.000Z',
    }

    await service.processFinalizeJob('task-1')

    expect(stateService.markPublished).toHaveBeenCalledWith('task-1', {
      platformWorkId: 'video_1',
      permalink: 'https://www.douyin.com/video/video_1',
      dataOption: {
        shareId: 'share_1',
        itemId: 'item_1',
        videoId: 'video_1',
        workLink: 'https://www.douyin.com/video/video_1',
      },
      originalWorkLink: undefined,
      workStatus: undefined,
    })
  })

  it('fails expired Douyin user action polling when no final video_id is available', async () => {
    const { service, stateService, queueService, record } = createService(
      {
        finalize: vi.fn(async () => ({
          status: 202,
          platformWorkId: 'share_1',
          dataOption: {
            shareId: 'share_1',
            itemId: 'item_1',
            expiresAt: '2000-01-01T00:00:00.000Z',
          },
        })),
      },
      {
        publishPolicy: { completionStrategy: CompletionStrategy.UserHandoff },
      },
    )
    record.status = PublishStatus.WaitingForUserAction
    record.accountType = AccountType.Douyin
    record.platformWorkId = 'share_1'
    record.dataOption = {
      shareId: 'share_1',
      expiresAt: '2000-01-01T00:00:00.000Z',
    }

    await service.processFinalizeJob('task-1')

    expect(stateService.markFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: PlatformErrorCategory.Timeout,
      retryable: false,
    }))
    expect(queueService.enqueueMediaFinalize).not.toHaveBeenCalled()
  })
})

describe('publish task service failure messages', () => {
  it('uses localized platform fallback for exhausted Bilibili -500 failures instead of raw platform message', async () => {
    const { service, provider, stateService, record } = createService({
      publish: vi.fn(async () => {
        const response: AxiosResponse<BilibiliPlatformResponseBody> = {
          data: {
            code: -500,
            message: 'close err: rpc error: code = Unknown desc = -503',
            ttl: 1,
          } as BilibiliPlatformResponseBody,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {
            method: 'post',
            url: 'https://openupos.bilivideo.com/video/v2/part/upload',
          } as InternalAxiosRequestConfig,
        }
        throw BilibiliPlatformException.fromPlatformResponse(response)
      }),
    })
    record.accountType = AccountType.Bilibili

    await service.processPublishJob('task-1', 2)

    expect(provider.publish).toHaveBeenCalled()
    expect(stateService.markFailed).toHaveBeenCalledWith('task-1', expect.objectContaining({
      category: 'platform_unavailable',
      code: '15094',
      message: 'bilibili platform service is temporarily unavailable, please try again later',
      originalData: expect.objectContaining({
        platformCode: -500,
        httpStatus: 200,
        raw: expect.objectContaining({
          message: 'close err: rpc error: code = Unknown desc = -503',
        }),
      }),
      retryable: true,
    }))
  })
})

describe('publish task service update validation', () => {
  it('persists parsed update options from the platform option schema', async () => {
    const { service, stateService, queueService, record } = createService(
      { update: vi.fn() },
      {
        publishPolicy: { updateSupported: true },
        optionSchema: z.object({
          title: z.string().min(1).describe('标题'),
        }),
      },
    )
    record.status = PublishStatus.Published

    await service.requestUpdate('user-1', 'task-1', {
      option: { title: 'new title' },
    })

    expect(stateService.markWaitingForUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({
      option: { title: 'new title' },
    }))
    expect(queueService.enqueueUpdate).toHaveBeenCalledWith('task-1')
  })

  it('rejects invalid update options before writing the pending update', async () => {
    const { service, stateService, queueService, record } = createService(
      { update: vi.fn() },
      {
        publishPolicy: { updateSupported: true },
        optionSchema: z.object({
          title: z.string().min(1).describe('标题'),
        }),
      },
    )
    record.status = PublishStatus.Published

    await expect(service.requestUpdate('user-1', 'task-1', {
      option: { unknown: true },
    })).rejects.toThrow()

    expect(stateService.markWaitingForUpdate).not.toHaveBeenCalled()
    expect(queueService.enqueueUpdate).not.toHaveBeenCalled()
  })

  it('prepares update media from adaptation options and strips them from pending platform options', async () => {
    const resolvedMediaRules = { imageFormats: ['jpg', 'jpeg'], maxImageSize: 8 * 1024 * 1024 }
    const resolveMediaRules = vi.fn(() => resolvedMediaRules)
    const { service, stateService, queueService, record, mediaService } = createService(
      {
        update: vi.fn(),
        resolveMediaRules,
      },
      {
        publishPolicy: { updateSupported: true },
        optionSchema: z.object({
          title: z.string().optional().describe('标题'),
        }),
        mediaRules: resolvedMediaRules,
        mediaPolicy: { imageQuality: 80 },
      },
    )
    Object.assign(record, {
      status: PublishStatus.Published,
      title: 'old title',
      desc: 'old body',
      imgUrlList: ['https://cdn.example.test/source.png'],
      coverUrl: 'https://cdn.example.test/cover.png',
    })
    const preparedContent = {
      title: 'old title',
      body: 'new body',
      media: [{ url: 'https://cdn.example.test/source.jpeg' }],
      cover: { url: 'https://cdn.example.test/cover.jpeg' },
    }
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: preparedContent,
      issues: [],
    })

    await service.requestUpdate('user-1', 'task-1', {
      content: {
        body: 'new body',
        media: [{
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: 'jpeg' } },
        }],
        cover: {
          url: 'https://cdn.example.test/cover.png',
          options: { adaptation: { imageFormat: 'jpeg' } },
        },
      },
      option: {
        title: 'new title',
      },
    })

    expect(resolveMediaRules).toHaveBeenCalledWith(expect.objectContaining({
      platform: AccountType.Kwai,
      accountId: 'account-1',
      option: { title: 'new title' },
    }))
    expect(mediaService.preparePublishContentMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      content: expect.objectContaining({
        media: [expect.objectContaining({
          options: { adaptation: { imageFormat: 'jpeg' } },
        })],
        cover: expect.objectContaining({
          options: { adaptation: { imageFormat: 'jpeg' } },
        }),
      }),
      mediaRules: resolvedMediaRules,
      mediaPolicy: { imageQuality: 80 },
    }))
    expect(mediaService.validateMedia).toHaveBeenCalledWith(preparedContent, resolvedMediaRules)
    expect(stateService.markWaitingForUpdate).toHaveBeenCalledWith('task-1', {
      content: preparedContent,
      option: { title: 'new title' },
    })
    expect(queueService.enqueueUpdate).toHaveBeenCalledWith('task-1')
  })

  it('stores backend-normalized extensionless video media in pending updates', async () => {
    const { service, stateService, queueService, record, mediaService } = createService(
      { update: vi.fn() },
      {
        publishPolicy: { updateSupported: true },
        mediaRules: { videoFormats: ['mp4'] },
      },
    )
    const videoUrl = 'https://cdn.example.test/signed-video'
    const preparedContent = {
      title: 'old title',
      body: 'old body',
      media: [{ url: videoUrl, metadata: { type: 'video' as const } }],
    }
    Object.assign(record, {
      status: PublishStatus.Published,
      title: 'old title',
      desc: 'old body',
      imgUrlList: ['https://cdn.example.test/source.png'],
    })
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: preparedContent,
      issues: [],
    })

    await service.requestUpdate('user-1', 'task-1', {
      content: {
        media: [{ url: videoUrl }],
      },
    })

    expect(stateService.markWaitingForUpdate).toHaveBeenCalledWith('task-1', {
      content: preparedContent,
      option: undefined,
    })
    expect(queueService.enqueueUpdate).toHaveBeenCalledWith('task-1')
  })

  it('keeps existing platform options when update option only controls media adaptation', async () => {
    const { service, stateService, record, mediaService } = createService(
      { update: vi.fn() },
      {
        publishPolicy: { updateSupported: true },
        mediaRules: { imageFormats: ['jpg', 'jpeg'] },
      },
    )
    Object.assign(record, {
      status: PublishStatus.Published,
      option: { reply_settings: 'following' },
      title: 'old title',
      desc: 'old body',
      imgUrlList: ['https://cdn.example.test/source.png'],
    })
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: {
        title: 'old title',
        body: 'old body',
        media: [{ url: 'https://cdn.example.test/source.jpeg' }],
      },
      issues: [],
    })

    await service.requestUpdate('user-1', 'task-1', {
      content: {
        media: [{
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: 'jpeg' } },
        }],
      },
    })

    expect(stateService.markWaitingForUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({
      option: { reply_settings: 'following' },
    }))
  })

  it('rejects media adaptation failures before writing the pending update', async () => {
    const { service, stateService, queueService, record, mediaService } = createService(
      { update: vi.fn() },
      {
        publishPolicy: { updateSupported: true },
        mediaRules: { imageFormats: ['jpg', 'jpeg'] },
      },
    )
    Object.assign(record, {
      status: PublishStatus.Published,
      title: 'old title',
      desc: 'old body',
      imgUrlList: ['https://cdn.example.test/source.png'],
    })
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: {
        title: 'old title',
        body: 'old body',
        media: [{ url: 'https://cdn.example.test/source.png' }],
      },
      issues: [{
        code: PublishValidationIssueCode.InvalidOption,
        path: ['content', 'media', 0, 'options', 'adaptation', 'imageFormat'],
        params: { field: PublishValidationField.Option },
      }],
    })

    await expect(service.requestUpdate('user-1', 'task-1', {
      content: {
        media: [{
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: 'webp' } },
        }],
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPublishValidationFailed,
    })

    expect(stateService.markWaitingForUpdate).not.toHaveBeenCalled()
    expect(queueService.enqueueUpdate).not.toHaveBeenCalled()
  })
})
