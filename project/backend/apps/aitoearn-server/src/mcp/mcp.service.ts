import { Injectable } from '@nestjs/common'
import { AppException, generateApiKey, ResponseCode } from '@yikart/common'
import { ApiKeyAccountRepository, ApiKeyRepository, APIKeyStatus, APIKeyType } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { AccountService } from '../account/account.service'
import { CreateApiKeyAccountDto, CreateMcpApiKeyDto, DeleteApiKeyAccountDto, McpListApiKeyAccountsQueryDto, McpListApiKeysQueryDto } from './mcp.dto'

@Injectable()
export class McpService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly apiKeyAccountRepository: ApiKeyAccountRepository,
    private readonly accountService: AccountService,
    private readonly redisService: RedisService,
  ) {}

  async createApiKey(userId: string, data: CreateMcpApiKeyDto) {
    const key = generateApiKey('sk', 'mcp')
    for (const accountId of data.accounts) {
      const account = await this.accountService.getAccountById(accountId)
      if (!account) {
        throw new AppException(ResponseCode.AccountNotFound)
      }
      await this.apiKeyAccountRepository.create({
        apiKey: key,
        accountId,
        accountType: account.type,
      })
    }
    return this.apiKeyRepository.create({
      key,
      userId,
      ...data,
      status: APIKeyStatus.Active,
      type: APIKeyType.Mcp,
    })
  }

  async deleteByApiKey(userId: string, key: string): Promise<boolean> {
    const mcpApiKey = await this.apiKeyRepository.getByKey(userId, key)
    if (!mcpApiKey) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    const delApiKey = await this.apiKeyRepository.deleteByApiKey(key)
    const delApiKeyAccounts = await this.apiKeyAccountRepository.deleteByApiKey(key)
    return delApiKey !== null && delApiKeyAccounts !== null
  }

  async updateApiKeyDesc(userId: string, key: string, desc: string) {
    const mcpApiKey = await this.apiKeyRepository.getByKey(userId, key)
    if (!mcpApiKey) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    return await this.apiKeyRepository.updateDesc(key, desc)
  }

  async isActive(key: string) {
    const data = await this.redisService.ttl(`api-key:mcp:${key}`)
    return data > 0
  }

  async getList(
    userId: string,
    query: McpListApiKeysQueryDto,
  ) {
    query.userId = userId
    return await this.apiKeyRepository.listWithPagination(query)
  }

  async createApiKeyAccount(account: CreateApiKeyAccountDto) {
    return await this.apiKeyAccountRepository.create(account)
  }

  async deleteApiKeyAccount(userId: string, data: DeleteApiKeyAccountDto) {
    const mcpApiKey = await this.apiKeyRepository.getByKey(userId, data.key)
    if (!mcpApiKey) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    return await this.apiKeyAccountRepository.deleteByAccountId(data.key, data.accountId)
  }

  async getApiKeyAccountsCount(key: string): Promise<number> {
    return await this.apiKeyAccountRepository.countApiKeyAccounts({
      key,
    })
  }

  async getApiKeyAccountsList(
    userId: string,
    key: string,
    page: McpListApiKeyAccountsQueryDto,
  ) {
    const mcpApiKey = await this.apiKeyRepository.getByKey(userId, key)
    if (!mcpApiKey) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    return await this.apiKeyAccountRepository.listWithPagination({
      apiKey: key,
      page: page.page,
      pageSize: page.pageSize,
    })
  }

  async getAllApiKeyAccounts(apiKey: string) {
    return await this.apiKeyAccountRepository.list({ apiKey })
  }
}
