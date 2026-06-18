import type { BeforeApplicationShutdown } from '@nestjs/common'
import type { DraftGenerationData } from '@yikart/aitoearn-queue'
import type { Job, Worker } from 'bullmq'
import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { getErrorMessage } from '@yikart/common'
import { AiLogRepository, AiLogStatus } from '@yikart/mongodb'
import { UnrecoverableError } from 'bullmq'
import { config } from '../../config'
import { DraftGenerationError, DraftGenerationService } from './draft-generation.service'

interface ActiveDraftGenerationJob {
  job: Job<DraftGenerationData>
  token?: string
}

abstract class DraftGenerationConsumerBase extends WorkerHost implements BeforeApplicationShutdown {
  private readonly logger: Logger
  private readonly activeJobs = new Map<string, ActiveDraftGenerationJob>()

  constructor(
    private readonly draftGenerationService: DraftGenerationService,
    private readonly aiLogRepository: AiLogRepository,
    loggerName: string,
  ) {
    super()
    this.logger = new Logger(loggerName)
  }

  override async process(job: Job<DraftGenerationData>, token?: string): Promise<void> {
    const { aiLogId, userId, userType, groupId, version } = job.data
    this.activeJobs.set(this.getActiveJobKey(job), { job, token })

    try {
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
      else {
        const aiLog = await this.aiLogRepository.getById(aiLogId)
        if (aiLog && aiLog.status !== AiLogStatus.Generating) {
          this.logger.warn({ aiLogId, status: aiLog.status }, 'Skipping draft generation because AiLog is no longer generating')
          return
        }
      }

      if (version === 'v2-image-text') {
        const { prompt, captionPrompt, imageUrls, imageModel, imageCount, imageSize, aspectRatio, imageTextDraftType, platforms, plannerModel, disableMemory } = job.data
        this.logger.log(
          { aiLogId, imageModel, imageCount, aspectRatio, imageUrlsCount: imageUrls?.length ?? 0, promptLength: prompt?.length ?? 0, draftType: imageTextDraftType },
          'Processing v2-image-text generation',
        )
        await this.draftGenerationService.generateContentImageText(aiLogId, userId, userType, groupId, {
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
        this.logger.log({ aiLogId }, 'v2-image-text generation completed')
      }
      else if (version === 'v2') {
        const { prompt, captionPrompt, imageUrls, model, duration, resolution, aspectRatio, videoUrls, audioUrls, draftType, platforms, plannerModel, disableMemory } = job.data
        await this.draftGenerationService.generateContentV2(aiLogId, userId, userType, groupId, {
          prompt,
          captionPrompt,
          imageUrls,
          model,
          duration,
          resolution,
          aspectRatio,
          videoUrls,
          audioUrls,
          draftType,
          platforms,
          plannerModel,
          disableMemory,
        })
        this.logger.log({ aiLogId }, 'v2 generation completed')
      }
      else {
        const unsupportedVersion = String((job.data as { version?: string }).version ?? 'missing')
        throw new UnrecoverableError(`Unsupported draft generation version: ${unsupportedVersion}`)
      }
    }
    catch (error) {
      const originalError = error instanceof DraftGenerationError ? (error.cause ?? error) : error
      const errorMessage = getErrorMessage(originalError)
      const versionLabel = String((job.data as { version?: string }).version ?? 'missing')

      this.logger.error(
        originalError,
        `DraftGeneration failed (version=${versionLabel}, aiLogId=${aiLogId}, userId=${userId})`,
      )

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Failed,
          errorMessage,
        },
      })

      throw error
    }
    finally {
      this.activeJobs.delete(this.getActiveJobKey(job))
    }
  }

  async beforeApplicationShutdown() {
    const worker = this.getInitializedWorker()
    if (!worker) {
      return
    }

    await worker.pause(true)

    const activeJobs = [...this.activeJobs.values()]
    if (activeJobs.length === 0) {
      await worker.close(true)
      return
    }

    this.logger.warn({ count: activeJobs.length }, 'Failing active draft generation jobs before shutdown')

    for (const activeJob of activeJobs) {
      await this.failActiveJob(activeJob)
    }

    await worker.close(true)
  }

  private async failActiveJob(activeJob: ActiveDraftGenerationJob) {
    const { job, token } = activeJob
    const { aiLogId } = job.data
    const errorMessage = 'Application is shutting down; draft generation will retry'

    if (!token) {
      this.logger.warn({ aiLogId, jobId: job.id }, 'Cannot fail active draft generation job without lock token')
      return
    }

    try {
      await job.moveToFailed(new Error(errorMessage), token, false)
      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Failed,
          errorMessage,
        },
      })
    }
    catch (error) {
      this.logger.error({ error, aiLogId, jobId: job.id }, 'Failed to move active draft generation job to failed state')
    }
  }

  private getInitializedWorker(): Worker | undefined {
    try {
      return this.worker
    }
    catch (error) {
      this.logger.warn({ error }, 'Draft generation worker is not initialized')
      return undefined
    }
  }

  private getActiveJobKey(job: Job<DraftGenerationData>) {
    return job.id ?? job.data.aiLogId
  }
}

@QueueProcessor(QueueName.DraftGeneration, { concurrency: 60 })
export class DraftGenerationConsumer extends DraftGenerationConsumerBase {
  constructor(
    draftGenerationService: DraftGenerationService,
    aiLogRepository: AiLogRepository,
  ) {
    super(draftGenerationService, aiLogRepository, DraftGenerationConsumer.name)
  }

  override async process(job: Job<DraftGenerationData>, token?: string): Promise<void> {
    return super.process(job, token)
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

  override async process(job: Job<DraftGenerationData>, token?: string): Promise<void> {
    return super.process(job, token)
  }
}
