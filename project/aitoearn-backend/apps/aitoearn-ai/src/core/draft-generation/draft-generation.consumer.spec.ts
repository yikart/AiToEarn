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

describe('draftGenerationConsumer', () => {
  let consumer: DraftGenerationConsumer
  let mockDraftGenerationService: vi.Mocked<Pick<DraftGenerationService, 'generateContentV2' | 'generateContentImageText'>>
  let mockAiLogRepository: vi.Mocked<Pick<AiLogRepository, 'getById' | 'updateById'>>

  beforeEach(() => {
    mockDraftGenerationService = {
      generateContentV2: vi.fn().mockResolvedValue({ consumedPoints: 3 }),
      generateContentImageText: vi.fn().mockResolvedValue({ consumedPoints: 5 }),
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
        points: 0,
        errorMessage: 'Unsupported draft generation version: v1',
      },
    })
  })
})
