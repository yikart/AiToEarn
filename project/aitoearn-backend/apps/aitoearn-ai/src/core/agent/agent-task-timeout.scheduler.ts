import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import { Redlock } from '@yikart/redlock'
import { RedlockKey } from '../../common/enums'
import { config } from '../../config'
import { AgentService } from './agent.service'

@Injectable()
export class AgentTaskTimeoutScheduler {
  private readonly logger = new Logger(AgentTaskTimeoutScheduler.name)

  constructor(private readonly agentService: AgentService) { }

  /**
   * 每10分钟检查一次超时的 running 任务
   * 将超过配置的超时时间未更新的 running 任务更新为 error 状态
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  @Redlock(RedlockKey.AgentTaskTimeout, 600, { throwOnFailure: false })
  @WithLoggerContext()
  async recoverTimeoutRunningTasks() {
    const timeoutMs = config.agent.taskTimeoutMs
    this.logger.debug(
      `开始检查超时的 running 任务（超时时间: ${timeoutMs}ms，约 ${Math.round(timeoutMs / 1000 / 60)} 分钟）`,
    )

    const result
      = await this.agentService.recoverTimeoutRunningTasks(timeoutMs)
    if (result.updatedCount > 0) {
      this.logger.debug(
        `成功将 ${result.updatedCount} 个超时任务更新为 error 状态`,
      )
    }
  }
}
