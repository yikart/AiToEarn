import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { UserType } from '@yikart/common'
import { AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { config } from '../config'
import { VideoService, VideoTaskStatusResponse } from '../libs/new-api'

@Injectable()
export class VideoTaskStatusScheduler {
  private readonly logger = new Logger(VideoTaskStatusScheduler.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly videoService: VideoService,
    private readonly userClient: AitoearnUserClient,
  ) {}

  /**
   * 每30秒检查一次正在生成中的视频任务状态
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processVideoTaskStatus() {
    this.logger.log('开始检查视频生成任务状态')

    // 查找所有正在生成中的视频任务
    const generatingTasks = await this.aiLogRepo.list({
      type: AiLogType.Video,
      status: AiLogStatus.Generating,
    })

    if (generatingTasks.length === 0) {
      return
    }

    this.logger.log(`找到 ${generatingTasks.length} 个正在生成中的视频任务`)

    for (const task of generatingTasks) {
      const taskId = task.taskId
      if (!taskId) {
        this.logger.warn(`任务 ${task.id} 缺少 taskId，跳过检查`)
        continue
      }

      const result = await this.videoService.getVideoTaskStatus({
        apiKey: config.ai.newApi.apiKey,
        taskId,
      })

      if (result.status === 'SUCCESS') {
        if (task.points > 0 && task.userType === UserType.User) {
          await this.userClient.deductPoints({
            userId: task.userId,
            amount: task.points,
            type: 'ai_service',
            description: task.model,
          })
        }
        await this.updateTaskStatus(task.id, AiLogStatus.Success, result)

        this.logger.log(`视频任务 ${taskId} 已完成`)
      }
      else if (result.status === 'FAILURE' || result.status === 'UNKNOWN') {
        await this.updateTaskStatus(task.id, AiLogStatus.Failed, result)
        this.logger.log(`视频任务 ${taskId} 生成失败: ${result.fail_reason || '未知错误'}`)
      }
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    id: string,
    status: AiLogStatus,
    result: VideoTaskStatusResponse,
  ) {
    const task = await this.aiLogRepo.getById(id)

    if (!task) {
      this.logger.warn(`生成记录 ${id} 不存在`)
      return
    }

    const duration = Date.now() - task.startedAt.getTime()

    await this.aiLogRepo.updateById(id, {
      status,
      duration,
      response: result as unknown as Record<string, unknown>,
      ...(status === AiLogStatus.Failed && {
        errorMessage: result.fail_reason || '视频生成失败',
      }),
    })
  }
}
