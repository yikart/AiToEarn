import type { AiImageData, DraftGenerationData } from './interfaces'
import { UserType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { QueueService } from './queue.service'

describe('queueService draft generation queue info', () => {
  function createService(queues?: {
    aiImageAsync?: Record<string, unknown>
    normal?: Record<string, unknown>
    lowPriority?: Record<string, unknown>
  }) {
    const aiImageAsyncQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
      getJobs: vi.fn(),
      ...queues?.aiImageAsync,
    }
    const normalQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
      count: vi.fn(),
      getJobs: vi.fn(),
      ...queues?.normal,
    }
    const lowPriorityQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
      count: vi.fn(),
      getJobs: vi.fn(),
      ...queues?.lowPriority,
    }
    const service = Object.create(QueueService.prototype) as {
      defaultOptions: Record<string, unknown>
      aiImageAsyncQueue: typeof aiImageAsyncQueue
      draftGenerationQueue: typeof normalQueue
      draftGenerationLowPriorityQueue: typeof lowPriorityQueue
      addAiImageAsyncJob: QueueService['addAiImageAsyncJob']
      isAiImageAsyncJobActive: QueueService['isAiImageAsyncJobActive']
      addDraftGenerationJob: QueueService['addDraftGenerationJob']
      addLowPriorityDraftGenerationJob: QueueService['addLowPriorityDraftGenerationJob']
      getDraftGenerationQueueInfo: QueueService['getDraftGenerationQueueInfo']
      isDraftGenerationJobActive: QueueService['isDraftGenerationJobActive']
    }

    service.defaultOptions = { removeOnComplete: { age: 30, count: 1000 } }
    service.aiImageAsyncQueue = aiImageAsyncQueue
    service.draftGenerationQueue = normalQueue
    service.draftGenerationLowPriorityQueue = lowPriorityQueue

    return { service, aiImageAsyncQueue, normalQueue, lowPriorityQueue }
  }

  const data: DraftGenerationData = {
    aiLogId: 'log-1',
    userId: 'user-1',
    userType: UserType.User,
    groupId: 'group-1',
    version: 'v2-image-text',
  }

  const imageData = {
    logId: 'image-log-1',
    userId: 'user-1',
    userType: UserType.User,
    model: 'seedream-3',
    type: 'image',
    request: {},
    taskType: 'generation',
  } as unknown as AiImageData

  it('异步图片入队时固定使用 logId 作为 jobId', async () => {
    const { service, aiImageAsyncQueue } = createService()

    await service.addAiImageAsyncJob(imageData)

    expect(aiImageAsyncQueue.add).toHaveBeenCalledWith('generate', imageData, expect.objectContaining({
      jobId: 'image-log-1',
    }))
  })

  it('异步图片 active 查询优先使用固定 jobId', async () => {
    const getState = vi.fn().mockResolvedValue('active')
    const { service, aiImageAsyncQueue } = createService({
      aiImageAsync: {
        getJob: vi.fn().mockResolvedValue({ getState }),
        getJobs: vi.fn(),
      },
    })

    await expect(service.isAiImageAsyncJobActive('image-log-1')).resolves.toBe(true)

    expect(aiImageAsyncQueue.getJob).toHaveBeenCalledWith('image-log-1')
    expect(aiImageAsyncQueue.getJobs).not.toHaveBeenCalled()
  })

  it('异步图片 active 查询兼容旧任务扫描 logId', async () => {
    const { service, aiImageAsyncQueue } = createService({
      aiImageAsync: {
        getJob: vi.fn().mockResolvedValue(undefined),
        getJobs: vi.fn().mockResolvedValue([
          { data: { logId: 'other-log' } },
          { data: { logId: 'image-log-1' } },
        ]),
      },
    })

    await expect(service.isAiImageAsyncJobActive('image-log-1')).resolves.toBe(true)

    expect(aiImageAsyncQueue.getJobs).toHaveBeenCalledWith(['active'], 0, -1, true)
  })

  it('草稿生成入队时固定使用 aiLogId 作为 jobId', async () => {
    const { service, normalQueue, lowPriorityQueue } = createService()

    await service.addDraftGenerationJob(data, { priority: 1000 })
    await service.addLowPriorityDraftGenerationJob(data, { priority: 1000 })

    expect(normalQueue.add).toHaveBeenCalledWith('generate', data, expect.objectContaining({
      priority: 1000,
      jobId: 'log-1',
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }))
    expect(lowPriorityQueue.add).toHaveBeenCalledWith('generate', data, expect.objectContaining({
      priority: 1000,
      jobId: 'log-1',
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }))
  })

  it('返回队列位置时只包含 position 和 waitingCount', async () => {
    const { service, normalQueue } = createService({
      normal: {
        getJob: vi.fn().mockResolvedValue({
          id: 'log-1',
          getState: vi.fn().mockResolvedValue('prioritized'),
        }),
        count: vi.fn().mockResolvedValue(8),
        getJobs: vi.fn().mockResolvedValue([
          { id: 'log-0' },
          { id: 'log-1' },
        ]),
      },
    })

    const queueInfo = await service.getDraftGenerationQueueInfo('log-1')

    expect(queueInfo).toEqual({
      position: 2,
      waitingCount: 8,
    })
    expect(Object.keys(queueInfo ?? {})).toEqual(['position', 'waitingCount'])
    expect(normalQueue.getJobs).toHaveBeenCalledWith(['prioritized', 'waiting', 'delayed', 'waiting-children'], 0, -1, true)
  })

  it('普通队列未命中时查询低优先级队列但不暴露队列类型', async () => {
    const { service, lowPriorityQueue } = createService({
      normal: {
        getJob: vi.fn().mockResolvedValue(undefined),
      },
      lowPriority: {
        getJob: vi.fn().mockResolvedValue({
          id: 'log-1',
          getState: vi.fn().mockResolvedValue('active'),
        }),
        count: vi.fn().mockResolvedValue(4),
        getJobs: vi.fn(),
      },
    })

    const queueInfo = await service.getDraftGenerationQueueInfo('log-1')

    expect(queueInfo).toEqual({
      position: null,
      waitingCount: 4,
    })
    expect(lowPriorityQueue.getJobs).not.toHaveBeenCalled()
  })

  it('草稿 active 查询检查普通和低优先级队列', async () => {
    const { service, normalQueue, lowPriorityQueue } = createService({
      normal: {
        getJob: vi.fn().mockResolvedValue({
          getState: vi.fn().mockResolvedValue('completed'),
        }),
      },
      lowPriority: {
        getJob: vi.fn().mockResolvedValue({
          getState: vi.fn().mockResolvedValue('active'),
        }),
      },
    })

    await expect(service.isDraftGenerationJobActive('log-1')).resolves.toBe(true)

    expect(normalQueue.getJob).toHaveBeenCalledWith('log-1')
    expect(lowPriorityQueue.getJob).toHaveBeenCalledWith('log-1')
  })
})
