import { AppException, BrowserEnvironmentStatus, ResponseCode } from '@aitoearn/common'
import { BrowserEnvironmentRepository, BrowserProfileRepository } from '@aitoearn/mongodb'
import { Injectable } from '@nestjs/common'
import { MultiloginHelper } from '../../common/helpers'
import { config } from '../../config'
import { CloudInstanceService } from '../cloud-instance'
import { MultiloginAccountService } from '../multilogin-account'
import {
  CreateBrowserEnvironmentDto,
  ListBrowserEnvironmentsDto,
} from './browser-environment.dto'

@Injectable()
export class BrowserEnvironmentService {
  constructor(
    private readonly browserEnvironmentRepository: BrowserEnvironmentRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly cloudInstanceService: CloudInstanceService,
    private readonly multiloginHelper: MultiloginHelper,
  ) {}

  async createEnvironment(dto: CreateBrowserEnvironmentDto) {
    const account = await this.allocateMultiloginAccount()

    try {
      const instance = await this.cloudInstanceService.createInstance(dto.region, `browser-env-${dto.userId}-${Date.now()}`)

      const environment = await this.browserEnvironmentRepository.create({
        userId: dto.userId,
        instanceId: instance.id,
        region: dto.region,
        status: BrowserEnvironmentStatus.Creating,
        ip: instance.ip,
        password: instance.password,
      })

      const profileId = await this.createMultiloginProfile(
        `env-${environment.id}-${Date.now()}`,
      )

      await this.browserProfileRepository.create({
        accountId: account.id,
        profileId,
        environmentId: environment.id,
        config: {},
      })

      return environment
    }
    catch (error) {
      await this.multiloginAccountService.decrementCurrentProfiles(account.id)
      throw error
    }
  }

  async listEnvironments(dto: ListBrowserEnvironmentsDto) {
    return await this.browserEnvironmentRepository.listWithPagination(dto)
  }

  async getEnvironmentStatus(environmentId: string) {
    const environment = await this.browserEnvironmentRepository.getById(environmentId)
    if (!environment) {
      throw new AppException(ResponseCode.BrowserEnvironmentNotFound)
    }
    return environment
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    const environment = await this.browserEnvironmentRepository.getById(environmentId)
    if (!environment) {
      throw new AppException(ResponseCode.BrowserEnvironmentNotFound)
    }

    const profiles = await this.browserProfileRepository.listByEnvironmentId(environmentId)
    for (const profile of profiles) {
      await this.multiloginAccountService.decrementCurrentProfiles(profile.accountId)
    }

    await this.browserProfileRepository.deleteByEnvironmentId(environmentId)
    await this.browserEnvironmentRepository.deleteById(environmentId)
  }

  private async allocateMultiloginAccount() {
    const accounts = await this.multiloginAccountService.listAccountsWithAvailableSlots(1)

    if (accounts.length === 0) {
      throw new AppException(ResponseCode.NoAvailableMultiloginAccount)
    }

    const optimalAccount = accounts[0]
    await this.multiloginAccountService.incrementCurrentProfiles(optimalAccount.id)

    return optimalAccount
  }

  private async createMultiloginProfile(name: string): Promise<string> {
    // 获取 Multilogin 账户实例
    const accounts = await this.multiloginAccountService.listAccountsWithAvailableSlots(1)
    if (accounts.length === 0) {
      throw new AppException(ResponseCode.NoAvailableMultiloginAccount)
    }

    const account = accounts[0]
    const client = await this.multiloginHelper.withAccount(account)

    // 默认的 profile 参数
    const defaultParameters = {
      flags: {
        screen_masking: 'mask',
        graphics_masking: 'mask',
        navigator_masking: 'mask',
      },
    } as const

    const response = await client.createProfile({
      folder_id: config.multilogin.folderId,
      name,
      browser_type: 'mimic',
      os_type: 'windows',
      parameters: defaultParameters,
    })

    return response.data.ids[0]
  }
}
