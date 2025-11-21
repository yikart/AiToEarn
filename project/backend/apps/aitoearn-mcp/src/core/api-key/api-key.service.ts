import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { ApiKeyAccountRepository, ApiKeyRepository, OAuth2CredentialRepository } from '@yikart/mongodb'

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly apiKeyAccountRepository: ApiKeyAccountRepository,
    private readonly oauth2CredentialRepository: OAuth2CredentialRepository,
  ) { }

  async getApiKeyInfo(apiKey: string) {
    const apiKeyInfo = await this.apiKeyRepository.getByKey(apiKey)
    return apiKeyInfo
  }

  async getAccountsByApiKey(apiKey: string) {
    const accounts = await this.apiKeyAccountRepository.list(apiKey)
    if (!accounts) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    const oauth2Credentials = await this.oauth2CredentialRepository.listByAccountIds(accounts.map(account => account.accountId))
    const oauth2CredentialsMap = new Map(oauth2Credentials.map(credential => [credential.accountId, credential]))
    accounts.forEach((account) => {
      account.status = oauth2CredentialsMap.get(account.accountId)?.isExpired ? 'OFFLINE' : 'ONLINE'
    })
    return accounts
  }
}
