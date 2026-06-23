import type { EventEnvelope, EventPayloadMap } from '@yikart/redis'
import { AccountType } from '@yikart/common'
import { EventTopic } from '@yikart/redis'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublishRecordService } from './publish-record.service'

vi.mock('../content/material.service', () => ({
  MaterialService: class MaterialService {},
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
  PublishRecordLinkStatus: {
    READY: 'ready',
  },
  PublishRecordSource: {
    TaskLink: 'task_link',
    OfflineQr: 'offline_qr',
  },
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
  PublishType: {
    VIDEO: 1,
    IMAGE: 2,
  },
}))

vi.mock('@yikart/redis', () => ({
  EventStream: {
    Channels: 'channels',
  },
  EventTopic: {
    ChannelsPublishTaskPublished: 'channels.publish.task.published',
  },
  OnEventStream: () => () => undefined,
}))

function createEnvelope<TTopic extends EventTopic>(topic: TTopic, payload: EventPayloadMap[TTopic]): EventEnvelope<TTopic> {
  return {
    eventId: 'event_1',
    topic,
    version: 1,
    occurredAt: '2026-06-09T00:00:00.000Z',
    source: 'publish-state',
    idempotencyKey: 'event_1',
    payload,
  }
}

function createService() {
  const publishRecordRepository = {
    upDayPublishInfo: vi.fn(async () => ({ id: 'day_1' })),
  }
  const materialService = {
    addUseCount: vi.fn(async () => true),
  }

  return {
    service: new PublishRecordService(
      publishRecordRepository as never,
      materialService as never,
    ),
    publishRecordRepository,
    materialService,
  }
}

async function handlePublished(
  service: PublishRecordService,
  payload: EventPayloadMap[EventTopic.ChannelsPublishTaskPublished],
) {
  await (service as unknown as {
    handlePublishCompletedEvent: (envelope: EventEnvelope<EventTopic.ChannelsPublishTaskPublished>) => Promise<void>
  }).handlePublishCompletedEvent(createEnvelope(EventTopic.ChannelsPublishTaskPublished, payload))
}

describe('publish record service publish completion events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs the existing publish completion side effects from channel published events', async () => {
    const {
      service,
      publishRecordRepository,
      materialService,
    } = createService()

    await handlePublished(service, {
      taskId: 'record_1',
      publishRecordId: 'record_1',
      userId: 'user_1',
      accountId: 'account_1',
      accountType: AccountType.TikTok,
      uid: 'uid_1',
      platformWorkId: 'post_1',
      materialId: 'material_1',
    })

    expect(materialService.addUseCount).toHaveBeenCalledWith('material_1')
    expect(publishRecordRepository.upDayPublishInfo).toHaveBeenCalledWith({ userId: 'user_1' })
  })

  it('skips optional material side effects when event payload lacks a material identifier', async () => {
    const {
      service,
      publishRecordRepository,
      materialService,
    } = createService()

    await handlePublished(service, {
      taskId: 'record_1',
      publishRecordId: 'record_1',
      userId: 'user_1',
      accountType: AccountType.TikTok,
    })

    expect(materialService.addUseCount).not.toHaveBeenCalled()
    expect(publishRecordRepository.upDayPublishInfo).toHaveBeenCalledWith({ userId: 'user_1' })
  })
})
