import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import {
  AiLog,
  AiLogChannel,
  AiLogRepository,
  AiLogType,
} from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { RedlockKey } from '../../../common/enums'
import { AideoService } from './aideo.service'

@Injectable()
export class AideoTaskStatusScheduler {
  private readonly logger = new Logger(AideoTaskStatusScheduler.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly aideoService: AideoService,
  ) { }

  /**
   * 每30秒检查一次正在处理中的 Aideo 任务状态
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  @Redlock(RedlockKey.AideoTaskStatusCheck, 60, { throwOnFailure: false })
  @WithLoggerContext()
  async processAideoTaskStatus() {
    this.logger.debug('开始检查 Aideo 任务状态')

    const generatingTasks = await this.aiLogRepo.listGeneratingByType(AiLogType.Aideo, AiLogChannel.Volcengine)

    if (generatingTasks.length === 0) {
      return
    }

    this.logger.debug(`找到 ${generatingTasks.length} 个正在处理中的 Aideo 任务`)

    for (const task of generatingTasks) {
      await this.processTask(task)
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: AiLog) {
    try {
      await this.aideoService.processAideoTask(task)
    }
    catch (error) {
      this.logger.error({ error, taskId: task.id }, '处理 Aideo 任务失败')
    }
  }
}
