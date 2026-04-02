import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import { AiLog, AiLogChannel, AiLogRepository, AiLogType } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { RedlockKey } from '../../../common'
import { GeminiService } from '../libs/gemini'
import { GrokLibService, GrokVideoTaskStatus } from '../libs/grok'
import { OpenaiService } from '../libs/openai'
import { VolcengineService } from '../libs/volcengine'
import { GeminiVideoService } from './gemini'
import { GrokVideoService } from './grok'
import { OpenAIVideoCallbackDto, OpenAIVideoService } from './openai'
import { VolcengineCallbackDto, VolcengineVideoService } from './volcengine'

@Injectable()
export class VideoTaskStatusScheduler {
  private readonly logger = new Logger(VideoTaskStatusScheduler.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly volcengineVideoService: VolcengineVideoService,
    private readonly openaiVideoService: OpenAIVideoService,
    private readonly volcengineLibService: VolcengineService,
    private readonly openaiLibService: OpenaiService,
    private readonly geminiLibService: GeminiService,
    private readonly geminiVideoService: GeminiVideoService,
    private readonly grokLibService: GrokLibService,
    private readonly grokVideoService: GrokVideoService,
  ) { }

  /**
   * 每30秒检查一次正在生成中的视频任务状态
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  @Redlock(RedlockKey.VideoTaskStatusCheck, 600, { throwOnFailure: false })
  @WithLoggerContext()
  async processVideoTaskStatus() {
    this.logger.debug('开始检查视频生成任务状态')

    const generatingTasks = await this.aiLogRepo.listGeneratingByType(AiLogType.Video)

    if (generatingTasks.length === 0) {
      return
    }

    this.logger.debug(`找到 ${generatingTasks.length} 个正在生成中的视频任务`)

    for (const task of generatingTasks) {
      await this.processTask(task)
    }
  }

  /**
   * 处理单个任务
   */
  @Redlock(task => `${RedlockKey.VideoTaskStatusCheck}:${(task as AiLog).id}`, 60, { throwOnFailure: false })
  private async processTask(task: AiLog) {
    const taskId = task.taskId!
    const channel = task.channel

    if (channel === AiLogChannel.Volcengine) {
      const result = await this.volcengineLibService.getVideoGenerationTask(taskId)
      await this.volcengineVideoService.callback(result as unknown as VolcengineCallbackDto)
    }
    else if (channel === AiLogChannel.OpenAI) {
      const result = await this.openaiLibService.retrieveVideo(taskId)
      await this.openaiVideoService.callback(result as unknown as OpenAIVideoCallbackDto)
    }
    else if (channel === AiLogChannel.Gemini) {
      try {
        const operation = await this.geminiLibService.getOperation(this.geminiVideoService.getOperation({ name: taskId }))
        await this.geminiVideoService.callback(operation)
      }
      catch (e) {
        await this.geminiVideoService.callback(this.geminiVideoService.getOperation({ name: taskId, error: { message: (e as Error).message } }))
      }
    }
    else if (channel === AiLogChannel.Grok) {
      try {
        const result = await this.grokLibService.getVideoStatus(taskId)
        await this.grokVideoService.callback(result, task)
      }
      catch (e) {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          await this.grokVideoService.callback({
            status: GrokVideoTaskStatus.Failed,
            error: { code: 'NOT_FOUND', message: 'Task not found on Grok (404)' },
          }, task)
        }
        else {
          throw e
        }
      }
    }
    else {
      this.logger.warn(`任务 ${task.id} 未知的 channel: ${channel}，跳过检查`)
    }
  }
}
