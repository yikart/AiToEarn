import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CloudSpace, CloudSpaceRegion, CloudSpaceRepository, CloudSpaceStatus } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { Queue } from 'bullmq'
import { CloudInstanceStatus, JobName, QueueName, RedlockKey } from '../common/enums'
import { CloudInstanceService } from '../core/cloud-instance'

@Injectable()
export class CloudSpaceSetupScheduler {
  private readonly logger = new Logger(CloudSpaceSetupScheduler.name)

  constructor(
    private readonly cloudSpaceRepository: CloudSpaceRepository,
    private readonly cloudInstanceService: CloudInstanceService,
    @InjectQueue(QueueName.CloudspaceConfigure) private readonly configQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @Redlock(RedlockKey.CloudSpaceConfigTask)
  async processCloudSpaceConfiguration() {
    await this.processCreatingCloudSpaces()
    await this.processConfiguringCloudSpaces()
  }

  private async processCreatingCloudSpaces() {
    const cloudSpaces = await this.cloudSpaceRepository.listByStatus({
      status: CloudSpaceStatus.Creating,
    })

    if (cloudSpaces.length === 0) {
      return
    }

    this.logger.log(`找到 ${cloudSpaces.length} 个Creating状态的环境`)

    const regionGroups = new Map<CloudSpaceRegion, CloudSpace[]>()
    for (const cloudSpace of cloudSpaces) {
      if (!regionGroups.has(cloudSpace.region)) {
        regionGroups.set(cloudSpace.region, [])
      }
      regionGroups.get(cloudSpace.region)!.push(cloudSpace)
    }

    for (const [region, regionCloudSpaces] of regionGroups) {
      const instanceIds = regionCloudSpaces.map(cs => cs.instanceId)
      const instanceStatuses = await this.cloudInstanceService.listInstanceStatus(instanceIds, region)

      for (const cloudSpace of regionCloudSpaces) {
        const instanceStatus = instanceStatuses.find(status => status.instanceId === cloudSpace.instanceId)

        if (!instanceStatus) {
          this.logger.warn(`未找到实例 ${cloudSpace.instanceId} 的状态信息`)
          continue
        }

        if (instanceStatus.status === CloudInstanceStatus.Running) {
          await this.enqueueConfigurationTask(cloudSpace, instanceStatus.ip)
        }
      }
    }
  }

  private async processConfiguringCloudSpaces() {
    const configuringSpaces = await this.cloudSpaceRepository.listByStatus({
      status: CloudSpaceStatus.Configuring,
    })

    if (configuringSpaces.length === 0) {
      return
    }

    this.logger.log(`检查 ${configuringSpaces.length} 个Configuring状态的环境`)

    for (const cloudSpace of configuringSpaces) {
      await this.enqueueConfigurationTask(cloudSpace)
    }
  }

  private async enqueueConfigurationTask(cloudSpace: CloudSpace, newIp?: string) {
    if (newIp && newIp !== cloudSpace.ip) {
      await this.cloudSpaceRepository.updateById(cloudSpace.id, { ip: newIp })
      cloudSpace.ip = newIp
    }

    await this.configQueue.add(
      JobName.ConfigureCloudspace,
      { cloudSpaceId: cloudSpace.id },
      { jobId: cloudSpace.id }, // 使用cloudSpace.id作为jobId确保幂等性
    )
  }
}
