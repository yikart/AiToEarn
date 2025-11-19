import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { from, lastValueFrom, timer } from 'rxjs'
import { retry, tap } from 'rxjs/operators'
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

@Processor(QueueName.AiImageAsync, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class ImageConsumer extends WorkerHost {
  private readonly logger = new Logger(ImageConsumer.name)
  private readonly MAX_RETRIES = 3
  private readonly INITIAL_DELAY = 5000 // 5秒
  private readonly BACKOFF_MULTIPLIER = 2

  constructor(
    private readonly imageService: ImageService,
    private readonly aiLogRepo: AiLogRepository,
  ) {
    super()
  }

  /**
   * 判断错误是否可重试
   * 网络错误、超时、429、5xx 可重试
   * 参数错误、权限错误、4xx（除429）不可重试
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return true
    }

    const errorMessage = error.message.toLowerCase()
    const errorName = error.name.toLowerCase()

    // 网络相关错误（可重试）
    const networkErrors = [
      'fetch',
      'network',
      'timeout',
      'econnreset',
      'econnrefused',
      'etimedout',
      'socket',
      'connect',
    ]
    if (networkErrors.some(pattern => errorName.includes(pattern) || errorMessage.includes(pattern))) {
      return true
    }

    // HTTP 状态码判断
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return true // 429 Too Many Requests
    }
    if (errorMessage.match(/5\d{2}/)) {
      return true // 5xx 服务器错误
    }

    // 明确的不可重试错误
    const nonRetryablePatterns = [
      'invalid',
      'required',
      'must be',
      'should be',
      'bad request',
      'unauthorized',
      'forbidden',
      'not found',
      'insufficient',
      'missing',
      '400',
      '401',
      '403',
      '404',
    ]
    if (nonRetryablePatterns.some(pattern => errorMessage.includes(pattern))) {
      return false
    }

    // 默认可重试（保守策略）
    return true
  }

  /**
   * 执行单次任务
   */
  private async executeTask(taskType: string, request: unknown): Promise<unknown> {
    switch (taskType) {
      case 'generation':
        return await this.imageService.generation(request as ImageGenerationDto)
      case 'edit':
        return await this.imageService.edit(request as ImageEditDto)
      case 'md2card':
        return await this.imageService.md2Card(request as Md2CardDto)
      case 'fireflyCard':
        return await this.imageService.fireflyCard(request as FireflyCardDto)
      default:
        throw new Error(`Unknown task type: ${taskType}`)
    }
  }

  async process(job: Job<AsyncTaskData>): Promise<unknown> {
    const { logId, userId, userType, model, pricing, request, taskType } = job.data
    this.logger.log(`[log-${logId}] Processing async image task: ${taskType}`)

    const startedAt = new Date()
    let attemptCount = 0

    try {
      // 使用 RxJS 进行带重试的任务执行
      const result = await lastValueFrom(
        from(this.executeTask(taskType, request)).pipe(
          tap(() => {
            attemptCount++
          }),
          retry({
            count: this.MAX_RETRIES,
            delay: (error, retryCount) => {
              attemptCount = retryCount + 1
              const isRetryable = this.isRetryableError(error)

              // 如果不可重试，立即抛出错误
              if (!isRetryable) {
                this.logger.error(
                  `[log-${logId}] Non-retryable error: ${error instanceof Error ? error.message : String(error)}`,
                  error instanceof Error ? error.stack : undefined,
                )
                throw error
              }

              const delayMs = this.INITIAL_DELAY * this.BACKOFF_MULTIPLIER ** (retryCount - 1)
              this.logger.warn(
                `[log-${logId}] Attempt ${retryCount} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delayMs}ms...`,
              )

              return timer(delayMs)
            },
          }),
        ),
      )

      const duration = Date.now() - startedAt.getTime()

      // 更新日志为成功状态
      await this.aiLogRepo.updateById(logId, {
        duration,
        status: AiLogStatus.Success,
        response: result as Record<string, unknown>,
      })

      this.logger.log(
        `[log-${logId}] Task completed successfully${attemptCount > 1 ? ` after ${attemptCount} attempts` : ''}`,
      )
      return result
    }
    catch (error: unknown) {
      const duration = Date.now() - startedAt.getTime()
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isRetryable = this.isRetryableError(error)

      // 退还积分
      if (pricing > 0 && userType === UserType.User) {
        await this.imageService.addUserPoints(userId, pricing, model)
      }

      // 更新日志为失败状态
      await this.aiLogRepo.updateById(logId, {
        duration,
        status: AiLogStatus.Failed,
        errorMessage: isRetryable && attemptCount > 1
          ? `${errorMessage} (已重试 ${attemptCount - 1} 次)`
          : errorMessage,
      })

      this.logger.error(
        `[log-${logId}] Task failed after ${attemptCount} attempts: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
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
