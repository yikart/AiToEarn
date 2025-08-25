import { Injectable } from '@nestjs/common'
import { NatsClient } from '@yikart/nats-client'
import {
  BrowserEnvironment,
  BrowserProfile,
  CreateBrowserEnvironmentDto,
  CreateMultiloginAccountDto,
  DeleteBrowserEnvironmentDto,
  GetBrowserEnvironmentStatusDto,
  IdDto,
  ListBrowserEnvironmentsDto,
  ListBrowserProfilesDto,
  ListMultiloginAccountsDto,
  MultiloginAccount,
  PaginationResponse,
  UpdateMultiloginAccountDto,
} from './fingerprint-manager.interfaces'

@Injectable()
export class FingerprintManagerClient {
  constructor(private readonly natsClient: NatsClient) {}

  // 浏览器环境管理
  async createEnvironment(dto: CreateBrowserEnvironmentDto): Promise<BrowserEnvironment> {
    return this.natsClient.send<BrowserEnvironment>('fingerprint.environment.create', dto)
  }

  async listEnvironments(dto: ListBrowserEnvironmentsDto): Promise<PaginationResponse<BrowserEnvironment>> {
    return this.natsClient.send<PaginationResponse<BrowserEnvironment>>('fingerprint.environment.list', dto)
  }

  async getEnvironmentStatus(dto: GetBrowserEnvironmentStatusDto): Promise<BrowserEnvironment> {
    return this.natsClient.send<BrowserEnvironment>('fingerprint.environment.status', dto)
  }

  async deleteEnvironment(dto: DeleteBrowserEnvironmentDto): Promise<void> {
    return this.natsClient.send<void>('fingerprint.environment.delete', dto)
  }

  // 浏览器配置文件管理
  async listProfiles(dto: ListBrowserProfilesDto): Promise<PaginationResponse<BrowserProfile>> {
    return this.natsClient.send<PaginationResponse<BrowserProfile>>('fingerprint.profile.list', dto)
  }

  // MultiLogin 账号管理
  async createMultiloginAccount(dto: CreateMultiloginAccountDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('multilogin-account.create', dto)
  }

  async listMultiloginAccounts(dto: ListMultiloginAccountsDto): Promise<PaginationResponse<MultiloginAccount>> {
    return this.natsClient.send<PaginationResponse<MultiloginAccount>>('multilogin-account.list', dto)
  }

  async getMultiloginAccountById(dto: IdDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('multilogin-account.getById', dto)
  }

  async updateMultiloginAccount(dto: UpdateMultiloginAccountDto): Promise<MultiloginAccount> {
    return this.natsClient.send<MultiloginAccount>('multilogin-account.update', dto)
  }

  async removeMultiloginAccount(dto: IdDto): Promise<void> {
    return this.natsClient.send<void>('multilogin-account.remove', dto)
  }
}
