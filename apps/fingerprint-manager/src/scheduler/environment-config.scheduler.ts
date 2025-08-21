import { BrowserEnvironmentStatus } from '@aitoearn/common'
import { BrowserEnvironmentRepository, BrowserProfileRepository } from '@aitoearn/mongodb'
import { MultiloginService } from '@aitoearn/multilogin'
import { Redlock } from '@aitoearn/redlock'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedlockLockKey } from '../common/enums'
import { CloudInstanceService } from '../core/cloud-instance'
import { MultiloginAccountService } from '../core/multilogin-account'

@Injectable()
export class EnvironmentConfigScheduler {
  private readonly logger = new Logger(EnvironmentConfigScheduler.name)

  constructor(
    private readonly browserEnvironmentRepository: BrowserEnvironmentRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly cloudInstanceService: CloudInstanceService,
    private readonly multiloginService: MultiloginService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @Redlock(RedlockLockKey.EnvironmentConfigTask, 25000)
  async processEnvironmentConfiguration() {
    this.logger.debug('开始扫描待配置的环境')

    try {
      // 查找所有Creating状态的环境
      const [environments] = await this.browserEnvironmentRepository.listWithPagination({
        status: BrowserEnvironmentStatus.Creating,
        page: 1,
        pageSize: 50, // 每次处理最多50个环境
      })

      if (environments.length === 0) {
        this.logger.debug('没有找到待配置的环境')
        return
      }

      this.logger.log(`找到 ${environments.length} 个待配置的环境`)

      // 并发处理多个环境
      const promises = environments.map(environment =>
        this.doConfigureEnvironment(environment.id),
      )

      await Promise.allSettled(promises)
    }
    catch (error) {
      this.logger.error('环境配置调度任务执行失败', error)
    }
  }

  @Redlock(RedlockLockKey.EnvConfig, 60000)
  private async doConfigureEnvironment(environmentId: string): Promise<void> {
    this.logger.debug(`开始配置环境: ${environmentId}`)

    try {
      // 重新获取环境信息，确保状态仍然是Creating
      const environment = await this.browserEnvironmentRepository.getById(environmentId)
      if (!environment) {
        this.logger.warn(`环境 ${environmentId} 不存在`)
        return
      }

      if (environment.status !== BrowserEnvironmentStatus.Creating) {
        this.logger.debug(`环境 ${environmentId} 状态已变更为 ${environment.status}，跳过配置`)
        return
      }

      await this.browserEnvironmentRepository.updateById(environmentId, {
        status: BrowserEnvironmentStatus.Configuring,
      })

      this.logger.log(`环境 ${environmentId} 开始配置`)

      await this.cloudInstanceService.waitForInstanceReady(environment.instanceId, environment.region)
      this.logger.debug(`环境 ${environmentId} 云实例已就绪`)

      await this.deployBrowserAgent(environment.ip)
      this.logger.debug(`环境 ${environmentId} Browser Agent部署完成`)

      await this.browserEnvironmentRepository.updateById(environmentId, {
        status: BrowserEnvironmentStatus.Ready,
      })

      this.logger.log(`环境 ${environmentId} 配置完成`)
    }
    catch (error) {
      this.logger.error(`环境 ${environmentId} 配置过程中发生错误`, error)

      await this.browserEnvironmentRepository.updateById(environmentId, {
        status: BrowserEnvironmentStatus.Error,
      })
    }
  }

  private async deployBrowserAgent(_instanceIp: string): Promise<void> {
    // TODO: 实现真实的Agent部署逻辑
    // 这里应该使用SSH或其他方式在云主机上部署指纹管理Agent
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 5000)
    })
  }
}
