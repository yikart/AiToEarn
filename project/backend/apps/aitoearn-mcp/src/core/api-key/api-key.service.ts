import { Injectable } from '@nestjs/common'
import { AppException } from '../../libs/common'
import { ResponseCode } from '../../libs/common/enums'
import { APIKeyStatus } from '../../libs/mongodb/enums'
import { ApiKeyAccountRepository, ApiKeyRepository } from '../../libs/mongodb/repositories'
import { OAuth2CredentialRepository } from '../../libs/mongodb/repositories/oauth2-credential.repository'

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly apiKeyAccountRepository: ApiKeyAccountRepository,
    private readonly oauth2CredentialRepository: OAuth2CredentialRepository,
  ) { }

  async getApiKeyInfo(apiKey: string) {
    const apiKeyInfo = await this.apiKeyRepository.getByApiKey(apiKey)
    return apiKeyInfo
  }

  async getAccountsByApiKey(apiKey: string) {
    const accounts = await this.apiKeyAccountRepository.list({ apiKey })
    if (!accounts) {
      throw new AppException(ResponseCode.ApiKeyNotFound)
    }
    const oauth2Credentials = await this.oauth2CredentialRepository.listByAccountIds(accounts.map(account => account.accountId))
    const oauth2CredentialsMap = new Map(oauth2Credentials.map(credential => [credential.accountId, credential]))
    accounts.forEach((account) => {
      account.status = oauth2CredentialsMap.get(account.accountId)?.isExpired ? APIKeyStatus.Expired : APIKeyStatus.Active
    })
    return accounts
  }
}
