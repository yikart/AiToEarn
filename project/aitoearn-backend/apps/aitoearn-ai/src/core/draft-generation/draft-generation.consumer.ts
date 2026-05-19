import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { DraftGenerationData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { getErrorMessage } from '@yikart/common'
import { AiLogRepository, AiLogStatus } from '@yikart/mongodb'
import { Job, UnrecoverableError } from 'bullmq'
import { config } from '../../config'
import { DraftGenerationError, DraftGenerationService } from './draft-generation.service'

abstract class DraftGenerationConsumerBase extends WorkerHost {
  private readonly logger: Logger
  constructor(
    private readonly draftGenerationService: DraftGenerationService,
    private readonly aiLogRepository: AiLogRepository,
    loggerName: string,
  ) {
    super()
    this.logger = new Logger(loggerName)
  }

  override async process(job: Job<DraftGenerationData>): Promise<void> {
    const { aiLogId, userId, userType, groupId, version } = job.data

    if (job.attemptsMade > 0) {
      const aiLog = await this.aiLogRepository.getById(aiLogId)
      if (aiLog?.status === AiLogStatus.Success) {
        this.logger.log({ aiLogId, attemptsMade: job.attemptsMade }, 'Skipping retry: AiLog already succeeded')
        return
      }
      this.logger.log({ aiLogId, attemptsMade: job.attemptsMade }, 'Retrying draft generation')
      await this.aiLogRepository.updateById(aiLogId, {
        $set: { status: AiLogStatus.Generating },
        $unset: { errorMessage: '' },
      })
    }

    try {
      if (version === 'v2-image-text') {
        const { prompt, captionPrompt, imageUrls, imageModel, imageCount, imageSize, aspectRatio, imageTextDraftType, platforms, plannerModel, disableMemory } = job.data
        this.logger.log(
          { aiLogId, imageModel, imageCount, aspectRatio, imageUrlsCount: imageUrls?.length ?? 0, promptLength: prompt?.length ?? 0, draftType: imageTextDraftType },
          'Processing v2-image-text generation',
        )
        const { consumedPoints } = await this.draftGenerationService.generateContentImageText(aiLogId, userId, userType, groupId, {
          prompt: prompt ?? '',
          captionPrompt,
          imageUrls,
          imageModel: imageModel ?? 'gemini-3.1-flash-image-preview',
          imageCount: imageCount ?? 3,
          imageSize,
          aspectRatio,
          draftType: imageTextDraftType,
          platforms,
          plannerModel,
          disableMemory,
        })
        this.logger.log({ aiLogId, consumedPoints }, 'v2-image-text generation completed')
      }
      else if (version === 'v2') {
        const { prompt, captionPrompt, imageUrls, model, duration, resolution, aspectRatio, videoUrls, draftType, platforms, plannerModel, disableMemory } = job.data
        const { consumedPoints } = await this.draftGenerationService.generateContentV2(aiLogId, userId, userType, groupId, {
          prompt,
          captionPrompt,
          imageUrls,
          model,
          duration,
          resolution,
          aspectRatio,
          videoUrls,
          draftType,
          platforms,
          plannerModel,
          disableMemory,
        })
        this.logger.log({ aiLogId, consumedPoints }, 'v2 generation completed')
      }
      else {
        const unsupportedVersion = String((job.data as { version?: string }).version ?? 'missing')
        throw new UnrecoverableError(`Unsupported draft generation version: ${unsupportedVersion}`)
      }
    }
    catch (error) {
      const consumedPoints = error instanceof DraftGenerationError ? error.consumedPoints : 0
      const originalError = error instanceof DraftGenerationError ? (error.cause ?? error) : error
      const errorMessage = getErrorMessage(originalError)
      const versionLabel = String((job.data as { version?: string }).version ?? 'missing')

      this.logger.error(
        originalError,
        `DraftGeneration failed (version=${versionLabel}, aiLogId=${aiLogId}, userId=${userId}, consumedPoints=${consumedPoints})`,
      )

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Failed,
          points: consumedPoints,
          errorMessage,
        },
      })

      throw error
    }
  }
}

@QueueProcessor(QueueName.DraftGeneration, { concurrency: 20 })
export class DraftGenerationConsumer extends DraftGenerationConsumerBase {
  constructor(
    draftGenerationService: DraftGenerationService,
    aiLogRepository: AiLogRepository,
  ) {
    super(draftGenerationService, aiLogRepository, DraftGenerationConsumer.name)
  }

  override async process(job: Job<DraftGenerationData>): Promise<void> {
    return super.process(job)
  }
}

@QueueProcessor(QueueName.DraftGenerationLowPriority, {
  concurrency: config.ai.draftGeneration.queue.lowPriorityConcurrency,
})
export class DraftGenerationLowPriorityConsumer extends DraftGenerationConsumerBase {
  constructor(
    draftGenerationService: DraftGenerationService,
    aiLogRepository: AiLogRepository,
  ) {
    super(draftGenerationService, aiLogRepository, DraftGenerationLowPriorityConsumer.name)
  }

  override async process(job: Job<DraftGenerationData>): Promise<void> {
    return super.process(job)
  }
}
