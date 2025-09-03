import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { CloudSpaceStatus } from '@yikart/common'
import { CloudSpaceRepository } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { QueueName } from '../common/enums'
import { CloudSpaceService } from '../core/cloud-space'

interface TerminateExpiredCloudSpaceJobData {
  cloudSpaceId: string
}

@Processor(QueueName.CloudspaceExpiration)
export class CloudSpaceExpirationConsumer extends WorkerHost {
  private readonly logger = new Logger(CloudSpaceExpirationConsumer.name)

  constructor(
    private readonly cloudSpaceRepository: CloudSpaceRepository,
    private readonly cloudSpaceService: CloudSpaceService,
  ) {
    super()
  }

  async process(job: Job<TerminateExpiredCloudSpaceJobData>) {
    const { cloudSpaceId } = job.data
    this.logger.log(`开始处理过期云空间终止任务: ${cloudSpaceId}`)

    const cloudSpace = await this.cloudSpaceRepository.getById(cloudSpaceId)
    if (!cloudSpace) {
      this.logger.warn(`云空间 ${cloudSpaceId} 不存在，跳过处理`)
      return
    }

    const now = new Date()
    const expiredAt = cloudSpace.expiredAt

    if (expiredAt > now) {
      this.logger.warn(
        `云空间 ${cloudSpaceId} 尚未过期 (过期时间: ${expiredAt.toISOString()})，跳过处理`,
      )
      return
    }

    if (cloudSpace.status === CloudSpaceStatus.Terminated) {
      return
    }

    await this.cloudSpaceService.terminateCloudSpace(cloudSpaceId)

    this.logger.log(
      `云空间 ${cloudSpaceId} 已成功终止，实例 ${cloudSpace.instanceId} 已删除`,
    )
  }
}
