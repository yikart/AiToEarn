import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AccountType } from '../../common/enums'
import { OAuth2Credential } from '../schemas'
import { BaseRepository } from './base.repository'

export class OAuth2CredentialRepository extends BaseRepository<OAuth2Credential> {
  constructor(
    @InjectModel(OAuth2Credential.name) oauth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super(oauth2CredentialModel)
  }

  async getByAccountId(accountId: string) {
    return await this.findOne({ accountId })
  }

  async getByAccountIdAndPlatform(accountId: string, platform: AccountType) {
    return await this.findOne({ accountId, platform })
  }

  async listByAccountIds(accountIds: string[]) {
    return await this.find({ accountId: { $in: accountIds } })
  }
}
