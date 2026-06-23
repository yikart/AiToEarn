import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { getErrorMessage, getErrorStack, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { runWithAiGenerationRetry } from '../ai-generation-retry.util'
import { ImageEditDto, ImageGenerationDto } from './image.dto'
import { ImageService } from './image.service'

type AsyncImageTaskType = 'generation' | 'edit'

interface AsyncTaskData {
  logId: string
  userId: string
  userType: UserType
  model: string
  channel?: AiLogChannel
  type: AiLogType
  retry?: number
  request: unknown
  taskType: AsyncImageTaskType
}

@QueueProcessor(QueueName.AiImageAsync, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class ImageConsumer extends WorkerHost {
  private readonly logger = new Logger(ImageConsumer.name)

  constructor(
    private readonly imageService: ImageService,
    private readonly aiLogRepo: AiLogRepository,
  ) {
    super()
  }

  /**
   * 执行单次任务
   */
  private async executeTask(taskType: AsyncImageTaskType, request: unknown): Promise<unknown> {
    switch (taskType) {
      case 'generation':
        return await this.imageService.generation(request as ImageGenerationDto)
      case 'edit':
        return await this.imageService.edit(request as ImageEditDto)
      default:
        throw new Error(`Unknown task type: ${taskType}`)
    }
  }

  async process(job: Job<AsyncTaskData>): Promise<unknown> {
    const { logId, retry, request, taskType } = job.data
    this.logger.debug(`[log-${logId}] Processing async image task: ${taskType}`)

    const aiLog = await this.aiLogRepo.getById(logId)
    if (!aiLog || aiLog.status !== AiLogStatus.Generating) {
      this.logger.warn(`[log-${logId}] Skipping async image task because AiLog is no longer pending`)
      return undefined
    }

    const startedAt = new Date()
    let attemptCount = 0

    try {
      const result = await runWithAiGenerationRetry(
        async () => {
          attemptCount++
          return await this.executeTask(taskType, request)
        },
        retry,
        (error, attempt, maxAttempts) => {
          this.logger.warn(
            `[log-${logId}] Attempt ${attempt} failed: ${getErrorMessage(error)}. Retrying ${attempt + 1}/${maxAttempts}...`,
          )
        },
      )

      const duration = Date.now() - startedAt.getTime()

      // 更新日志为成功状态
      const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(
        logId,
        AiLogStatus.Generating,
        {
          $set: {
            duration,
            status: AiLogStatus.Success,
            response: result as Record<string, unknown>,
          },
        },
      )

      if (!updatedAiLog) {
        this.logger.warn(`[log-${logId}] Skipping async image result update because AiLog status changed`)
        return result
      }

      this.logger.debug(
        `[log-${logId}] Task completed successfully${attemptCount > 1 ? ` after ${attemptCount} attempts` : ''}`,
      )
      return result
    }
    catch (error: unknown) {
      const duration = Date.now() - startedAt.getTime()
      const errorMessage = getErrorMessage(error)

      // 更新日志为失败状态
      const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(logId, AiLogStatus.Generating, {
        $set: {
          duration,
          status: AiLogStatus.Failed,
          errorMessage: attemptCount > 1
            ? `${errorMessage} (已重试 ${attemptCount - 1} 次)`
            : errorMessage,
        },
      })

      if (!updatedAiLog) {
        this.logger.warn(`[log-${logId}] Skipping async image failure update because AiLog status changed`)
      }

      this.logger.error(
        `[log-${logId}] Task failed after ${attemptCount} attempts: ${errorMessage}`,
        getErrorStack(error),
      )
      throw error
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<AsyncTaskData>) {
    const { logId } = job.data
    this.logger.debug(`[log-${logId}] Job completed successfully`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AsyncTaskData>, error: Error) {
    const { logId } = job.data
    this.logger.error(`[log-${logId}] Job failed: ${error.message}`)
  }
}
