import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { MultiloginAccount, MultiloginAccountRepository } from '@yikart/mongodb'
import { CloudSpacesApi } from '../../transports/cloud-spaces/cloud-spaces.api'
import { DeleteCloudSpaceDto, GetCloudSpaceStatusDto, RetryCloudSpaceDto } from '../../transports/cloud-spaces/common'
import {
  CreateMultiloginAccountDto,
  ListBrowserProfilesDto,
  ListCloudSpacesDto,
  ListMultiloginAccountsDto,
  UpdateMultiloginAccountDto,
} from './cloud-spaces.dto'

@Injectable()
export class CloudSpacesService {
  constructor(private readonly cloudSpacesApi: CloudSpacesApi, private readonly multiloginAccountRepository: MultiloginAccountRepository) { }

  /**
   * 获取云空间列表
   */
  async listCloudSpaces(dto: ListCloudSpacesDto) {
    return await this.cloudSpacesApi.listCloudSpaces(dto)
  }

  /**
   * 获取云空间状态
   */
  async getCloudSpaceStatus(dto: GetCloudSpaceStatusDto) {
    return await this.cloudSpacesApi.getCloudSpaceStatus(dto)
  }

  /**
   * 删除云空间
   */
  async deleteCloudSpace(dto: DeleteCloudSpaceDto) {
    return await this.cloudSpacesApi.deleteCloudSpace(dto)
  }

  /**
   * 重试云空间
   */
  async retryCloudSpace(dto: RetryCloudSpaceDto) {
    return await this.cloudSpacesApi.retryCloudSpace(dto)
  }

  /**
   * 获取浏览器配置文件列表
   */
  async listProfiles(dto: ListBrowserProfilesDto) {
    return await this.cloudSpacesApi.listProfiles(dto)
  }

  /**
   * 创建Multilogin账号
   */
  async createMultiloginAccount(dto: CreateMultiloginAccountDto) {
    return await this.multiloginAccountRepository.create({
      ...dto,
      currentProfiles: 0,
    })
  }

  /**
   * 获取Multilogin账号列表
   */
  async listMultiloginAccounts(dto: ListMultiloginAccountsDto) {
    return await this.multiloginAccountRepository.listWithPagination(dto)
  }

  /**
   * 根据ID获取Multilogin账号
   */
  async getMultiloginAccountById(id: string): Promise<MultiloginAccount> {
    const account = await this.multiloginAccountRepository.getById(id)
    if (!account) {
      throw new AppException(1001, 'MultiloginAccountNotFound')
    }
    return account
  }

  /**
   * 更新Multilogin账号
   */
  async updateMultiloginAccount(id: string, updateData: UpdateMultiloginAccountDto): Promise<MultiloginAccount> {
    const account = await this.multiloginAccountRepository.updateById(id, updateData)
    if (!account) {
      throw new AppException(1001, 'MultiloginAccountNotFound')
    }
    return account
  }

  /**
   * 删除Multilogin账号
   */
  async removeMultiloginAccount(id: string): Promise<void> {
    const account = await this.multiloginAccountRepository.deleteById(id)
    if (!account) {
      throw new AppException(1001, 'MultiloginAccountNotFound')
    }
  }
}
