import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { DraftGenerationData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { getErrorMessage } from '@yikart/common'
import { AiLogRepository, AiLogStatus } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { DraftGenerationError, DraftGenerationService } from './draft-generation.service'

@QueueProcessor(QueueName.DraftGeneration, {
  concurrency: 3,
})
export class DraftGenerationConsumer extends WorkerHost {
  private readonly logger = new Logger(DraftGenerationConsumer.name)

  constructor(
    private readonly draftGenerationService: DraftGenerationService,
    private readonly aiLogRepository: AiLogRepository,
  ) {
    super()
  }

  async process(job: Job<DraftGenerationData>): Promise<void> {
    const { aiLogId, userId, userType, groupId, version } = job.data

    try {
      if (version === 'v2-image-text') {
        const { prompt, imageUrls, imageModel, imageCount, aspectRatio, imageTextDraftType, platforms } = job.data
        this.logger.log(
          { aiLogId, imageModel, imageCount, aspectRatio, imageUrlsCount: imageUrls?.length ?? 0, promptLength: prompt?.length ?? 0, draftType: imageTextDraftType },
          'Processing v2-image-text generation',
        )
        const { consumedPoints } = await this.draftGenerationService.generateContentImageText(aiLogId, userId, userType, groupId, {
          prompt: prompt ?? '',
          imageUrls,
          imageModel: imageModel ?? 'gemini-3.1-flash-image-preview',
          imageCount: imageCount ?? 3,
          aspectRatio,
          draftType: imageTextDraftType,
          platforms,
        })
        this.logger.log({ aiLogId, consumedPoints }, 'v2-image-text generation completed')
      }
      else if (version === 'v2') {
        const { prompt, imageUrls, model, duration, aspectRatio, videoUrls, draftType, platforms } = job.data
        const { consumedPoints } = await this.draftGenerationService.generateContentV2(aiLogId, userId, userType, groupId, {
          prompt,
          imageUrls,
          model,
          duration,
          aspectRatio,
          videoUrls,
          draftType,
          platforms,
        })
        this.logger.log({ aiLogId, consumedPoints }, 'v2 generation completed')
      }
      else {
        const { consumedPoints } = await this.draftGenerationService.generateContent(aiLogId, userId, userType, groupId)
        this.logger.log({ aiLogId, consumedPoints }, 'v1 generation completed')
      }
    }
    catch (error) {
      const consumedPoints = error instanceof DraftGenerationError ? error.consumedPoints : 0
      const originalError = error instanceof DraftGenerationError ? (error.cause ?? error) : error
      const errorMessage = getErrorMessage(originalError)
      const versionLabel = version ?? 'v1'

      this.logger.error(
        { aiLogId, userId, version: versionLabel, error: originalError instanceof Error ? { message: originalError.message, stack: originalError.stack } : originalError },
        `DraftGeneration failed (version=${versionLabel})`,
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
