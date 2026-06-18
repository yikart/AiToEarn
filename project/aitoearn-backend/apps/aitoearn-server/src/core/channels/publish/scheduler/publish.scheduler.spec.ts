import { AccountType } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { PublishScheduler } from './publish.scheduler'

vi.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_30_SECONDS: '*/30 * * * * *',
    EVERY_MINUTE: '* * * * *',
  },
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
  PublishStatus: {
    WaitingForPublish: 0,
    Queued: 6,
    Publishing: 2,
  },
}))

vi.mock('../../platforms/platforms.registry', () => ({
  PlatformIntegrationRegistry: class PlatformIntegrationRegistry {},
}))

vi.mock('../tasks/publish-queue.service', () => ({
  PublishQueueService: class PublishQueueService {},
}))

vi.mock('../tasks/publish-state.service', () => ({
  PublishStateService: class PublishStateService {},
}))

vi.mock('../tasks/publish-task.service', () => ({
  PublishTaskService: class PublishTaskService {},
}))

describe('publish scheduler', () => {
  it('rolls a failed enqueue back and continues scheduling later tasks', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-22T09:00:00.000Z'))
    const publishRecordRepo = {
      getPublishTaskListByTime: vi.fn(async () => [
        {
          id: 'task-1',
          status: PublishStatus.WaitingForPublish,
          publishTime: new Date('2026-05-22T09:00:00.000Z'),
          accountType: AccountType.Twitter,
        },
        {
          id: 'task-2',
          status: PublishStatus.WaitingForPublish,
          publishTime: new Date('2026-05-22T09:00:00.000Z'),
          accountType: AccountType.Twitter,
        },
      ]),
    }
    const registry = {
      get: vi.fn(() => ({ runtime: {} })),
      listIntegrations: vi.fn(() => []),
    }
    const stateService = {
      markQueued: vi.fn(async () => true),
      restoreQueuedToWaiting: vi.fn(async () => true),
    }
    const queueService = {
      enqueueImmediate: vi.fn()
        .mockRejectedValueOnce(new Error('queue down'))
        .mockResolvedValueOnce(undefined),
      enqueueDelayed: vi.fn(),
    }
    const scheduler = new PublishScheduler(
      publishRecordRepo as never,
      registry as never,
      stateService as never,
      queueService as never,
      {} as never,
    )

    await scheduler.loadTasksEnteringScheduleWindow()

    expect(stateService.restoreQueuedToWaiting).toHaveBeenCalledWith('task-1')
    expect(queueService.enqueueImmediate).toHaveBeenCalledWith('task-2')
    vi.useRealTimers()
  })

  it('resolves stale publishing tasks without rerunning publish jobs', async () => {
    const publishRecordRepo = {
      getStalePublishingTasks: vi.fn(async () => [{
        id: 'task-1',
        status: PublishStatus.Publishing,
      }]),
    }
    const taskService = {
      processPublishingTimeout: vi.fn(async () => undefined),
      processPublishJob: vi.fn(),
    }

    const scheduler = new PublishScheduler(
      publishRecordRepo as never,
      {} as never,
      {} as never,
      {} as never,
      taskService as never,
    )

    await scheduler.resolvePublishingTimeouts()

    expect(taskService.processPublishingTimeout).toHaveBeenCalledWith('task-1')
    expect(taskService.processPublishJob).not.toHaveBeenCalled()
  })
})
