import type { DraftGenerationData } from '@yikart/aitoearn-queue'
import type { AiLogRepository } from '@yikart/mongodb'
import type { Job } from 'bullmq'
import type { DraftGenerationService } from './draft-generation.service'
import { UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftGenerationConsumer } from './draft-generation.consumer'

const pinoLoggerMocks = vi.hoisted(() => {
  const logger = { child: vi.fn() }
  logger.child.mockReturnValue(logger)
  return { logger }
})

vi.mock('nestjs-pino', () => ({
  PinoLogger: {
    root: pinoLoggerMocks.logger,
  },
}))

vi.mock('../../config', async () => {
  const { z } = await import('zod')
  return {
    aiModelsConfigSchema: z.object({}).passthrough(),
    config: {
      ai: {
        models: {
          chat: [],
          image: {
            generation: [],
            edit: [],
          },
          video: {
            generation: [],
          },
        },
        gemini: {
          apiKey: '',
          baseUrl: '',
        },
        draftGeneration: {
          planner: {
            defaultModel: 'planner-model',
          },
          queue: {
            lowPriorityMinPriority: 1000,
            lowPriorityConcurrency: 2,
          },
          imageModels: [],
        },
      },
    },
  }
})

describe('draftGenerationConsumer', () => {
  let consumer: DraftGenerationConsumer
  let mockDraftGenerationService: vi.Mocked<Pick<DraftGenerationService, 'generateContentV2' | 'generateContentImageText'>>
  let mockAiLogRepository: vi.Mocked<Pick<AiLogRepository, 'getById' | 'updateById'>>

  beforeEach(() => {
    mockDraftGenerationService = {
      generateContentV2: vi.fn().mockResolvedValue(undefined),
      generateContentImageText: vi.fn().mockResolvedValue(undefined),
    }
    mockAiLogRepository = {
      getById: vi.fn(),
      updateById: vi.fn().mockResolvedValue({} as never),
    }
    consumer = new DraftGenerationConsumer(
      mockDraftGenerationService as unknown as DraftGenerationService,
      mockAiLogRepository as unknown as AiLogRepository,
    )
  })

  it('v2 job 透传 captionPrompt', async () => {
    await consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 1 },
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
        prompt: '视频提示词',
        captionPrompt: '文案提示词',
        model: 'grok-imagine-video',
        audioUrls: ['https://example.com/ref.mp3'],
      },
    } as Job<DraftGenerationData>)

    expect(mockDraftGenerationService.generateContentV2).toHaveBeenCalledWith(
      'log-1',
      'user-1',
      UserType.User,
      'group-1',
      expect.objectContaining({
        prompt: '视频提示词',
        captionPrompt: '文案提示词',
        model: 'grok-imagine-video',
        audioUrls: ['https://example.com/ref.mp3'],
      }),
    )
    expect(mockDraftGenerationService.generateContentImageText).not.toHaveBeenCalled()
  })

  it('v2-image-text job 透传 captionPrompt', async () => {
    await consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 1 },
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2-image-text',
        prompt: '图片提示词',
        captionPrompt: '文案提示词',
        imageModel: 'gemini-3.1-flash-image-preview',
      },
    } as Job<DraftGenerationData>)

    expect(mockDraftGenerationService.generateContentImageText).toHaveBeenCalledWith(
      'log-1',
      'user-1',
      UserType.User,
      'group-1',
      expect.objectContaining({
        prompt: '图片提示词',
        captionPrompt: '文案提示词',
        imageModel: 'gemini-3.1-flash-image-preview',
      }),
    )
    expect(mockDraftGenerationService.generateContentV2).not.toHaveBeenCalled()
  })

  it('未知版本不再 fallback 到 v1', async () => {
    await expect(consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 1 },
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v1',
      },
    } as unknown as Job<DraftGenerationData>)).rejects.toMatchObject({
      message: 'Unsupported draft generation version: v1',
    })

    expect(mockDraftGenerationService.generateContentV2).not.toHaveBeenCalled()
    expect(mockDraftGenerationService.generateContentImageText).not.toHaveBeenCalled()
    expect(mockAiLogRepository.updateById).toHaveBeenCalledWith('log-1', {
      $set: {
        status: AiLogStatus.Failed,
        errorMessage: 'Unsupported draft generation version: v1',
      },
    })
  })

  it('首次执行时 AiLog 已非 Generating 则跳过生成', async () => {
    mockAiLogRepository.getById.mockResolvedValue({
      id: 'log-1',
      status: AiLogStatus.Failed,
    } as never)

    await consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 1 },
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
        prompt: '视频提示词',
      },
    } as Job<DraftGenerationData>)

    expect(mockDraftGenerationService.generateContentV2).not.toHaveBeenCalled()
    expect(mockAiLogRepository.updateById).not.toHaveBeenCalled()
  })

  it('队列重试时重置失败日志并继续执行', async () => {
    mockAiLogRepository.getById.mockResolvedValue({
      id: 'log-1',
      status: AiLogStatus.Failed,
    } as never)

    await consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 1,
      opts: { attempts: 2 },
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
        prompt: '视频提示词',
      },
    } as Job<DraftGenerationData>)

    expect(mockAiLogRepository.updateById).toHaveBeenCalledWith('log-1', {
      $set: { status: AiLogStatus.Generating },
      $unset: { errorMessage: '' },
    })
    expect(mockDraftGenerationService.generateContentV2).toHaveBeenCalled()
  })

  it('应用下线时将 active 草稿任务标记为 failed 交给队列重试', async () => {
    const deferred = createDeferred<void>()
    mockDraftGenerationService.generateContentV2.mockReturnValue(deferred.promise)
    const moveToFailed = vi.fn().mockResolvedValue(undefined)
    const worker = setInitializedWorker(consumer)

    const processing = consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 2 },
      moveToFailed,
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
        prompt: '视频提示词',
      },
    } as unknown as Job<DraftGenerationData>, 'token-1')

    await vi.waitFor(() => {
      expect(mockDraftGenerationService.generateContentV2).toHaveBeenCalled()
    })

    await consumer.beforeApplicationShutdown()

    expect(worker.pause).toHaveBeenCalledWith(true)
    expect(moveToFailed).toHaveBeenCalledWith(expect.any(Error), 'token-1', false)
    expect(moveToFailed.mock.calls[0]?.[0]).toMatchObject({
      message: 'Application is shutting down; draft generation will retry',
    })
    expect(mockAiLogRepository.updateById).toHaveBeenCalledWith('log-1', {
      $set: {
        status: AiLogStatus.Failed,
        errorMessage: 'Application is shutting down; draft generation will retry',
      },
    })
    expect(worker.close).toHaveBeenCalledWith(true)

    deferred.resolve()
    await processing
  })

  it('应用下线时没有 active 草稿任务则只暂停并关闭 worker', async () => {
    const moveToFailed = vi.fn()
    const worker = setInitializedWorker(consumer)

    await consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 2 },
      moveToFailed,
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
      },
    } as unknown as Job<DraftGenerationData>, 'token-1')

    await consumer.beforeApplicationShutdown()

    expect(worker.pause).toHaveBeenCalledWith(true)
    expect(worker.close).toHaveBeenCalledWith(true)
    expect(moveToFailed).not.toHaveBeenCalled()
  })

  it('应用下线时 token 缺失的 active 草稿任务不强行标记 failed', async () => {
    const deferred = createDeferred<void>()
    mockDraftGenerationService.generateContentV2.mockReturnValue(deferred.promise)
    const moveToFailed = vi.fn().mockResolvedValue(undefined)
    setInitializedWorker(consumer)

    const processing = consumer.process({
      id: 'job-1',
      name: 'draft-generation',
      queueName: 'draft-generation',
      attemptsMade: 0,
      opts: { attempts: 2 },
      moveToFailed,
      data: {
        aiLogId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        groupId: 'group-1',
        version: 'v2',
      },
    } as unknown as Job<DraftGenerationData>)

    await vi.waitFor(() => {
      expect(mockDraftGenerationService.generateContentV2).toHaveBeenCalled()
    })

    await consumer.beforeApplicationShutdown()

    expect(moveToFailed).not.toHaveBeenCalled()
    expect(mockAiLogRepository.updateById).not.toHaveBeenCalledWith('log-1', expect.objectContaining({
      $set: expect.objectContaining({ status: AiLogStatus.Failed }),
    }))

    deferred.resolve()
    await processing
  })
})

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

function setInitializedWorker(consumer: DraftGenerationConsumer) {
  const worker = {
    pause: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const workerHost = consumer as unknown as { _worker: typeof worker }
  workerHost._worker = worker
  return worker
}
