import type { VideoAiLogByChannel } from './video-ai-log.interface'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { getErrorMessage, WithLoggerContext } from '@yikart/common'
import { AiLog, AiLogChannel, AiLogRepository, AiLogType } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { AxiosError } from 'axios'
import { RedlockKey } from '../../../common'
import { isNonRetryableAiRequestError } from '../ai-generation-retry.util'
import { DashscopeService as DashscopeLibService } from '../libs/dashscope'
import { GrokLibService, GrokVideoTaskStatus } from '../libs/grok'
import { OpenaiService } from '../libs/openai'
import { RelayLibService } from '../libs/relay'
import { VolcengineService } from '../libs/volcengine'
import { DashscopeVideoService } from './dashscope'
import { GrokVideoService } from './grok'
import { OpenAIVideoService } from './openai'
import { RelayVideoService } from './relay/relay-video.service'
import { VideoService } from './video.service'
import { VolcengineVideoService } from './volcengine/volcengine.service'

@Injectable()
export class VideoTaskStatusScheduler {
  private readonly logger = new Logger(VideoTaskStatusScheduler.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly videoService: VideoService,
    private readonly volcengineVideoService: VolcengineVideoService,
    private readonly openaiVideoService: OpenAIVideoService,
    private readonly volcengineLibService: VolcengineService,
    private readonly openaiLibService: OpenaiService,
    private readonly grokLibService: GrokLibService,
    private readonly grokVideoService: GrokVideoService,
    private readonly dashscopeLibService: DashscopeLibService,
    private readonly dashscopeVideoService: DashscopeVideoService,
    @Optional() private readonly relayLibService?: RelayLibService,
    @Optional() private readonly relayVideoService?: RelayVideoService,
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
      await this.volcengineVideoService.callback(result)
    }
    else if (channel === AiLogChannel.OpenAI) {
      const result = await this.openaiLibService.retrieveVideo(taskId)
      await this.openaiVideoService.callback(result)
    }
    else if (channel === AiLogChannel.Grok) {
      const grokTask = task as VideoAiLogByChannel<AiLogChannel.Grok>
      try {
        const result = await this.grokLibService.getVideoStatus(taskId)
        await this.grokVideoService.callback(result, grokTask)
      }
      catch (e) {
        if (!isNonRetryableAiRequestError(e)) {
          this.logger.warn(
            { error: e, taskId, aiLogId: task.id },
            'Grok video status query failed, waiting for next poll',
          )
          return
        }
        let errorMessage = getErrorMessage(e)
        let code = '500'
        if (e instanceof AxiosError) {
          const status = e?.response?.status
          if (status && status >= 400 && status < 500) {
            const data = e.response?.data
            errorMessage = data?.error || data?.code || `Grok API error (${status})`
            code = data?.code || `HTTP_${status}`
          }
        }
        await this.grokVideoService.callback({
          status: GrokVideoTaskStatus.Failed,
          error: { code, message: errorMessage },
        }, grokTask)
      }
    }
    else if (channel === AiLogChannel.Dashscope) {
      const result = await this.dashscopeLibService.getVideoTask(taskId)
      await this.dashscopeVideoService.callback(result)
    }
    else if (channel === AiLogChannel.Relay) {
      if (!this.relayLibService || !this.relayVideoService) {
        return this.skipUnregistered(task, channel)
      }
      const result = await this.relayLibService.getVideo(taskId)
      await this.relayVideoService.callback(result)
    }
    else {
      this.logger.warn(`任务 ${task.id} 未知的 channel: ${channel}，跳过检查`)
      return
    }

    await this.videoService.ensureSavedMediaByAiLogId(task.id)
  }

  private skipUnregistered(task: AiLog, channel: AiLogChannel): void {
    this.logger.warn(`任务 ${task.id} 的 channel ${channel} 未注册（配置缺失），跳过检查`)
  }
}
