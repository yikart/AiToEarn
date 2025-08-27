import { Injectable } from '@nestjs/common'
import { AppException, CloudSpaceStatus, ResponseCode } from '@yikart/common'
import { BrowserProfileRepository, CloudSpaceRepository, MultiloginAccount, Transactional } from '@yikart/mongodb'
import { ProfileParameters } from '@yikart/multilogin'
import dayjs from 'dayjs'
import { MultiloginHelper } from '../../common/helpers'
import { config } from '../../config'
import { CloudInstanceService } from '../cloud-instance'
import { MultiloginAccountService } from '../multilogin-account'
import {
  CreateCloudSpaceDto,
  ListCloudSpacesDto,
  RenewCloudSpaceDto,
} from './cloud-space.dto'

@Injectable()
export class CloudSpaceService {
  constructor(
    private readonly cloudSpaceRepository: CloudSpaceRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly cloudInstanceService: CloudInstanceService,
    private readonly multiloginHelper: MultiloginHelper,
  ) {}

  @Transactional()
  async createCloudSpace(dto: CreateCloudSpaceDto) {
    const account = await this.allocateMultiloginAccount()
    const instance = await this.cloudInstanceService.createInstance(dto.region, dto.month, `browser-env-${dto.userId}-${Date.now()}`)
    const cloudSpace = await this.cloudSpaceRepository.create({
      userId: dto.userId,
      instanceId: instance.id,
      region: dto.region,
      status: CloudSpaceStatus.Creating,
      ip: instance.ip,
      password: instance.password,
      expiredAt: instance.expiredAt || dayjs().add(dto.month, 'month').toDate(),
    })

    const { id: profileId, config } = await this.createMultiloginProfile(
      account,
      `env-${cloudSpace.id}-${Date.now()}`,
    )

    await this.browserProfileRepository.create({
      accountId: account.id,
      profileId,
      cloudSpaceId: cloudSpace.id,
      config,
    })

    return cloudSpace
  }

  async listCloudSpaces(dto: ListCloudSpacesDto) {
    return await this.cloudSpaceRepository.listWithPagination(dto)
  }

  async getCloudSpaceStatus(cloudSpaceId: string) {
    const cloudSpace = await this.cloudSpaceRepository.getById(cloudSpaceId)
    if (!cloudSpace) {
      throw new AppException(ResponseCode.CloudSpaceNotFound)
    }
    return cloudSpace
  }

  @Transactional()
  async renewCloudSpace(dto: RenewCloudSpaceDto) {
    const cloudSpace = await this.cloudSpaceRepository.getById(dto.cloudSpaceId)
    if (!cloudSpace) {
      throw new AppException(ResponseCode.CloudSpaceNotFound)
    }

    const currentExpiredAt = cloudSpace.expiredAt

    await this.cloudSpaceRepository.updateById(dto.cloudSpaceId, {
      expiredAt: dayjs(currentExpiredAt).add(dto.month, 'month').toDate(),
    })
  }

  @Transactional()
  async deleteCloudSpace(cloudSpaceId: string): Promise<void> {
    const cloudSpace = await this.cloudSpaceRepository.getById(cloudSpaceId)
    if (!cloudSpace) {
      throw new AppException(ResponseCode.CloudSpaceNotFound)
    }

    const profiles = await this.browserProfileRepository.listByCloudSpaceId(cloudSpaceId)
    for (const profile of profiles) {
      await this.multiloginAccountService.decrementCurrentProfiles(profile.accountId)
    }

    await this.browserProfileRepository.deleteByCloudSpaceId(cloudSpaceId)
    await this.cloudSpaceRepository.deleteById(cloudSpaceId)
  }

  private async allocateMultiloginAccount() {
    const accounts = await this.multiloginAccountService.listAccountsWithAvailableSlots(1)

    if (accounts.length === 0) {
      throw new AppException(ResponseCode.NoAvailableMultiloginAccount)
    }

    const optimalAccount = accounts[0]
    await this.multiloginAccountService.incrementCurrentProfiles(optimalAccount.id)

    return optimalAccount.toObject()
  }

  private async createMultiloginProfile(account: MultiloginAccount, name: string) {
    const client = await this.multiloginHelper.withAccount(account)

    const defaultParameters: ProfileParameters = {
      flags: {
        screen_masking: 'mask',
        graphics_masking: 'mask',
        navigator_masking: 'mask',
        media_devices_masking: 'mask',
        audio_masking: 'mask',
      },
      storage: {
        is_local: false,
      },
      custom_start_urls: ['https://ping0.cc'],
    }

    const defaultConfig = {
      os_type: 'windows',
      parameters: defaultParameters,
    } as const

    const response = await client.createProfile({
      folder_id: config.multilogin.folderId,
      name,
      browser_type: 'mimic',
      ...defaultConfig,
    })

    const profileId = response.data.ids[0]

    return {
      id: profileId,
      config: defaultConfig,
    }
  }
}
