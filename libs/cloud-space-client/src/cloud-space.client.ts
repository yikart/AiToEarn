import { Injectable } from '@nestjs/common'
import { PaginationVo } from '@yikart/common'
import { NatsClient } from '@yikart/nats-client'
import {
  BrowserProfile,
  CloudSpace,
  CreateCloudSpaceDto,
  CreateMultiloginAccountDto,
  DeleteCloudSpaceDto,
  GetCloudSpaceStatusDto,
  IdDto,
  ListBrowserProfilesDto,
  ListCloudSpacesByUserIdDto,
  ListCloudSpacesDto,
  ListMultiloginAccountsDto,
  MultiloginAccount,
  RenewCloudSpaceDto,
  UpdateMultiloginAccountDto,
} from './cloud-space.interfaces'

@Injectable()
export class CloudSpaceClient {
  constructor(private readonly natsClient: NatsClient) {}

  // 浏览器环境管理
  async createCloudSpace(dto: CreateCloudSpaceDto): Promise<CloudSpace> {
    return this.natsClient.send<CloudSpace>('cloud-space.create', dto)
  }

  async listCloudSpaces(dto: ListCloudSpacesDto): Promise<PaginationVo<CloudSpace>> {
    return this.natsClient.send<PaginationVo<CloudSpace>>('cloud-space.list', dto)
  }

  async listCloudSpacesByUserId(dto: ListCloudSpacesByUserIdDto): Promise<CloudSpace[]> {
    return this.natsClient.send<CloudSpace[]>('cloud-space.listByUserId', dto)
  }

  async getCloudSpaceStatus(dto: GetCloudSpaceStatusDto): Promise<CloudSpace> {
    return this.natsClient.send<CloudSpace>('cloud-space.status', dto)
  }

  async renewCloudSpace(dto: RenewCloudSpaceDto): Promise<void> {
    return this.natsClient.send<void>('cloud-space.renew', dto)
  }

  async deleteCloudSpace(dto: DeleteCloudSpaceDto): Promise<void> {
    return this.natsClient.send<void>('cloud-space.delete', dto)
  }

  // 浏览器Profile管理
  async listProfiles(dto: ListBrowserProfilesDto): Promise<PaginationVo<BrowserProfile>> {
    return this.natsClient.send<PaginationVo<BrowserProfile>>('cloud-space.profile.list', dto)
  }

  // MultiLogin 账号管理
  async createMultiloginAccount(dto: CreateMultiloginAccountDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('cloud-space.multilogin-account.create', dto)
  }

  async listMultiloginAccounts(dto: ListMultiloginAccountsDto): Promise<PaginationVo<MultiloginAccount>> {
    return this.natsClient.send<PaginationVo<MultiloginAccount>>('cloud-space.multilogin-account.list', dto)
  }

  async getMultiloginAccountById(dto: IdDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('cloud-space.multilogin-account.getById', dto)
  }

  async updateMultiloginAccount(dto: UpdateMultiloginAccountDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('cloud-space.multilogin-account.update', dto)
  }

  async removeMultiloginAccount(dto: IdDto): Promise<void> {
    return this.natsClient.send<void>('multilogin-account.remove', dto)
  }
}
