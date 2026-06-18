import { AccountType } from '@yikart/common'
import { EventStream, EventTopic } from '@yikart/redis'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../../platforms/platforms.exception'
import { PublishStateService } from './publish-state.service'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
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

vi.mock('@yikart/redis', () => ({
  EventStream: { Channels: 'channels' },
  EventTopic: {
    ChannelsPublishTaskFailed: 'channels.publish.failed',
    ChannelsPublishTaskPublished: 'channels.publish.published',
    ChannelsPublishTaskWaitingForUserAction: 'channels.publish.waiting-user-action',
    ChannelsPublishTaskUpdated: 'channels.publish.updated',
  },
  EventStreamService: class EventStreamService {},
}))

describe('publish state service', () => {
  it('writes data id, unique id and work link when marking a task published', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => ({
        id: 'task-1',
        userId: 'user-1',
        flowId: 'flow-1',
        materialId: 'material-1',
        accountId: 'account-1',
        accountType: AccountType.Douyin,
        uid: 'uid-1',
        status: 8,
        platformWorkId: 'share-1',
        dataOption: { shareId: 'share-1' },
      })),
      updateByIdAndStatuses: vi.fn(async () => ({
        id: 'task-1',
        userId: 'user-1',
        accountId: 'account-1',
        accountType: AccountType.Douyin,
        status: 1,
      })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markPublished('task-1', {
      platformWorkId: 'item-1',
      permalink: 'https://www.douyin.com/video/item-1',
      publishAt: new Date('2026-05-22T12:00:00.000Z'),
      dataOption: { itemId: 'item-1' },
      linkStatus: 'ready' as never,
      linkMeta: { source: 'webhook' },
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [2, 7, 8], {
      $set: expect.objectContaining({
        publishTime: new Date('2026-05-22T12:00:00.000Z'),
        platformWorkId: 'item-1',
        dataId: 'item-1',
        uniqueId: `${AccountType.Douyin}_item-1`,
        workLink: 'https://www.douyin.com/video/item-1',
        dataOption: { shareId: 'share-1', itemId: 'item-1' },
        linkStatus: 'ready',
        linkMeta: { source: 'webhook' },
      }),
      $unset: {
        errorData: '',
        pendingMediaJobs: '',
      },
    })
    expect(eventStream.emit).toHaveBeenCalledWith(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskPublished,
      expect.objectContaining({
        taskId: 'task-1',
        publishRecordId: 'task-1',
        flowId: 'flow-1',
        materialId: 'material-1',
        uid: 'uid-1',
        dataId: 'item-1',
        workLink: 'https://www.douyin.com/video/item-1',
        linkStatus: 'ready',
        linkMeta: { source: 'webhook' },
        publishedAt: new Date('2026-05-22T12:00:00.000Z'),
      }),
      { source: 'publish-state' },
    )
  })

  it('supplements an already published task without emitting another published event', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => ({
        id: 'task-1',
        userId: 'user-1',
        accountId: 'account-1',
        accountType: AccountType.Douyin,
        status: 1,
        platformWorkId: 'item-1',
        dataOption: { shareId: 'share-1' },
        linkMeta: { source: 'finalize' },
      })),
      updateByIdAndStatuses: vi.fn(async () => ({
        id: 'task-1',
        status: 1,
      })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markPublished('task-1', {
      platformWorkId: 'item-1',
      permalink: 'https://www.douyin.com/video/item-1',
      dataOption: { itemId: 'item-1' },
      linkStatus: 'ready' as never,
      linkMeta: { checkedAt: '2026-05-22T12:00:00.000Z' },
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [1], {
      $set: {
        workLink: 'https://www.douyin.com/video/item-1',
        dataOption: { shareId: 'share-1', itemId: 'item-1' },
        linkStatus: 'ready',
        linkMeta: { source: 'finalize', checkedAt: '2026-05-22T12:00:00.000Z' },
      },
    })
    expect(eventStream.emit).not.toHaveBeenCalled()
  })

  it('clears previous publish errors when marking a task as publishing', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => ({
        id: 'task-1',
        status: 6,
      })),
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 2 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markQueuedAsPublishing('task-1')).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [6], {
      $set: {
        status: 2,
        errorMsg: '',
      },
      $unset: {
        errorData: '',
      },
    })
  })

  it('keeps a retryable publishing failure snapshot while queueing the next publish attempt', async () => {
    const publishRecordRepo = {
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 6 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markPublishingRetryQueued('task-1', {
      category: PlatformErrorCategory.Network,
      code: '15074',
      message: 'network unavailable',
      originalData: { reason: 'socket hang up' },
      retryable: true,
      occurredAt: new Date('2026-06-09T00:00:00.000Z'),
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [2], {
      $set: {
        status: 6,
        errorMsg: 'network unavailable',
        errorData: {
          type: PlatformErrorCategory.Network,
          code: '15074',
          message: 'network unavailable',
          originalData: { reason: 'socket hang up' },
        },
      },
    })
  })

  it('marks a publishing task as waiting for user action and emits the waiting event', async () => {
    const publishRecordRepo = {
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 8 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)
    const expiresAt = new Date('2999-01-01T00:00:00.000Z')

    await expect(service.markWaitingForUserAction('task-1', {
      userAction: {
        shortLink: 'https://s.example.test/share-1',
        expiresAt,
        data: { shareId: 'share-1' },
      },
      platformWorkId: 'share-1',
      permalink: 'https://s.example.test/share-1',
      dataOption: { shareId: 'share-1' },
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [2], {
      $set: {
        status: 8,
        errorMsg: '',
        platformWorkId: 'share-1',
        workLink: 'https://s.example.test/share-1',
        dataOption: { shareId: 'share-1' },
      },
      $unset: {
        errorData: '',
      },
    })
    expect(eventStream.emit).toHaveBeenCalledWith(
      EventStream.Channels,
      EventTopic.ChannelsPublishTaskWaitingForUserAction,
      expect.objectContaining({ taskId: 'task-1', userAction: expect.objectContaining({ expiresAt }) }),
      { source: 'publish-state' },
    )
  })

  it('updates an existing user action waiting task without emitting another waiting event', async () => {
    const publishRecordRepo = {
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 8 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markWaitingForUserAction('task-1', {
      platformWorkId: 'share-1',
      dataOption: { shareId: 'share-1', itemId: 'item-1' },
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [8], {
      $set: {
        status: 8,
        errorMsg: '',
        platformWorkId: 'share-1',
        dataOption: { shareId: 'share-1', itemId: 'item-1' },
      },
      $unset: {
        errorData: '',
      },
    })
    expect(eventStream.emit).not.toHaveBeenCalled()
  })

  it('restores a failed submitted task to publishing for finalize retry', async () => {
    const publishRecordRepo = {
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 2 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markFailedAsPublishing('task-1')).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [-1], {
      $set: {
        status: 2,
        errorMsg: '',
      },
      $unset: {
        errorData: '',
      },
    })
  })

  it('restores retry state back to the previous failure snapshot', async () => {
    const publishRecordRepo = {
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: -1 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.restoreRetryStateToFailed('task-1', {
      errorMsg: 'VIDEO_NOT_EXIST',
      errorData: { type: 'media_processing_failed', code: '15074', message: 'VIDEO_NOT_EXIST' },
    })).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [0, 6, 2], {
      $set: {
        status: -1,
        errorMsg: 'VIDEO_NOT_EXIST',
        errorData: { type: 'media_processing_failed', code: '15074', message: 'VIDEO_NOT_EXIST' },
      },
    })
  })

  it('keeps every image in imgUrlList when marking an image update as completed', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => ({
        id: 'task-1',
        status: 4,
        pendingUpdate: {
          content: {
            title: 'updated title',
            body: 'updated body',
            media: [
              { url: 'https://assets.example.test/image-a.jpg', metadata: { type: 'image' } },
              { url: 'https://assets.example.test/image-b.jpg', metadata: { type: 'image' } },
            ],
          },
        },
      })),
      updateByIdAndStatuses: vi.fn(async () => ({ id: 'task-1', status: 1 })),
    }
    const eventStream = {
      emit: vi.fn(),
    }
    const service = new PublishStateService(publishRecordRepo as never, eventStream as never)

    await expect(service.markUpdated('task-1')).resolves.toBe(true)

    expect(publishRecordRepo.updateByIdAndStatuses).toHaveBeenCalledWith('task-1', [4], {
      $set: expect.objectContaining({
        videoUrl: undefined,
        imgUrlList: [
          'https://assets.example.test/image-a.jpg',
          'https://assets.example.test/image-b.jpg',
        ],
      }),
      $unset: {
        errorData: '',
        pendingUpdate: '',
      },
    })
  })
})
