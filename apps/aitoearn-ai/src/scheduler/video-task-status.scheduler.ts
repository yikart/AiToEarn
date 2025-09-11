import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AiLog, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { VideoService } from '../core/video'
import { VolcengineService } from '../libs/volcengine'

@Injectable()
export class VideoTaskStatusScheduler {
  private readonly logger = new Logger(VideoTaskStatusScheduler.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly videoService: VideoService,
    private readonly volcengineService: VolcengineService,
  ) {}

  /**
   * 每30秒检查一次正在生成中的视频任务状态
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processVideoTaskStatus() {
    this.logger.log('开始检查视频生成任务状态')

    const generatingTasks = await this.aiLogRepo.list({
      type: AiLogType.Video,
      status: AiLogStatus.Generating,
    })

    if (generatingTasks.length === 0) {
      return
    }

    this.logger.log(`找到 ${generatingTasks.length} 个正在生成中的视频任务`)

    for (const task of generatingTasks) {
      await this.processTask(task)
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: AiLog) {
    const taskId = task.taskId
    if (!taskId) {
      this.logger.warn(`任务 ${task.id} 缺少 taskId，跳过检查`)
      return
    }
    const channel = task.channel

    if (channel === 'kling') {
      await this.videoService.getKlingTask(task.userId, task.userType, task.id)
    }
    else if (channel === 'volcengine') {
      const result = await this.volcengineService.getVideoGenerationTask(taskId)
      await this.videoService.volcengineCallback(result)
    }
    else {
      this.logger.warn(`任务 ${task.id} 未知的 channel: ${channel}，跳过检查`)
    }
  }
}
