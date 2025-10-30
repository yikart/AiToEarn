import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CloudSpaceRepository, CloudSpaceStatus } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { Queue } from 'bullmq'
import { JobName, QueueName, RedlockKey } from '../common/enums'

@Injectable()
export class CloudSpaceExpirationScheduler {
  private readonly logger = new Logger(CloudSpaceExpirationScheduler.name)

  constructor(
    private readonly cloudSpaceRepository: CloudSpaceRepository,
    @InjectQueue(QueueName.CloudspaceExpiration) private readonly expirationQueue: Queue,
  ) {}

  /**
   * 每10分钟检查一次云空间过期情况
   * 处理已过期和即将在1小时内过期的云空间
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  @Redlock(RedlockKey.CloudSpaceExpirationTask)
  async processCloudSpaceExpiration() {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    this.logger.log('开始检查云空间过期情况')

    // 查找已过期和即将在1小时内过期的云空间
    const cloudSpaces = await this.cloudSpaceRepository.listByStatus({
      expiredAt: [undefined, oneHourLater],
      status: CloudSpaceStatus.Ready,
    })

    if (cloudSpaces.length === 0) {
      this.logger.log('没有找到需要处理的云空间')
      return
    }

    this.logger.log(`找到 ${cloudSpaces.length} 个需要处理的云空间`)

    for (const cloudSpace of cloudSpaces) {
      const expiredAt = new Date(cloudSpace.expiredAt)
      const delay = Math.max(0, Math.min(expiredAt.getTime() - now.getTime(), 60 * 60 * 1000))

      await this.expirationQueue.add(
        JobName.TerminateExpiredCloudspace,
        { cloudSpaceId: cloudSpace.id },
        {
          delay,
          jobId: `terminate-${cloudSpace.id}`,
          removeOnComplete: 10,
          removeOnFail: 10,
        },
      )
    }

    this.logger.log(`成功为 ${cloudSpaces.length} 个云空间创建了终止任务`)
  }
}
