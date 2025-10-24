import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { FireflyCardDto, ImageEditDto, ImageGenerationDto, Md2CardDto } from './image.dto'
import { ImageService } from './image.service'

interface AsyncTaskData {
  logId: string
  userId: string
  userType: UserType
  model: string
  channel?: AiLogChannel
  type: AiLogType
  pricing: number
  request: unknown
  taskType: 'generation' | 'edit' | 'md2card' | 'fireflyCard'
}

@Processor('ai_image_async', {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class ImageWorker extends WorkerHost {
  private readonly logger = new Logger(ImageWorker.name)

  constructor(
    private readonly imageService: ImageService,
    private readonly aiLogRepo: AiLogRepository,
  ) {
    super()
  }

  async process(job: Job<AsyncTaskData>): Promise<unknown> {
    const { logId, userId, userType, model, pricing, request, taskType } = job.data
    this.logger.log(`[log-${logId}] Processing async image task: ${taskType}`)

    const startedAt = new Date()

    try {
      let result: unknown

      switch (taskType) {
        case 'generation':
          result = await this.imageService.generation(request as ImageGenerationDto)
          break
        case 'edit':
          result = await this.imageService.edit(request as ImageEditDto)
          break
        case 'md2card':
          result = await this.imageService.md2Card(request as Md2CardDto)
          break
        case 'fireflyCard':
          result = await this.imageService.fireflyCard(request as FireflyCardDto)
          break
        default:
          throw new Error(`Unknown task type: ${taskType}`)
      }

      const duration = Date.now() - startedAt.getTime()

      // 更新日志为成功状态
      await this.aiLogRepo.updateById(logId, {
        duration,
        status: AiLogStatus.Success,
        response: result as Record<string, unknown>,
      })

      this.logger.log(`[log-${logId}] Task completed successfully`)
      return result
    }
    catch (error: unknown) {
      const duration = Date.now() - startedAt.getTime()
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (pricing > 0 && userType === UserType.User) {
        await this.imageService.addUserPoints(userId, pricing, model)
      }

      await this.aiLogRepo.updateById(logId, {
        duration,
        status: AiLogStatus.Failed,
        errorMessage,
      })

      this.logger.error(`[log-${logId}] Task failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined)
      throw error
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<AsyncTaskData>) {
    const { logId } = job.data
    this.logger.log(`[log-${logId}] Job completed successfully`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AsyncTaskData>, error: Error) {
    const { logId } = job.data
    this.logger.error(`[log-${logId}] Job failed: ${error.message}`)
  }
}
