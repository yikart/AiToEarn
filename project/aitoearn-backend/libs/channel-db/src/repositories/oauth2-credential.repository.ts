import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { OAuth2Credential } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class OAuth2CredentialRepository extends BaseRepository<OAuth2Credential> {
  constructor(
    @InjectModel(OAuth2Credential.name, DB_CONNECTION_NAME) private oauth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super(oauth2CredentialModel)
  }

  async getOne(accountId: string, platform: AccountType | 'meta') {
    const oauth2Credential = await this.oauth2CredentialModel.findOne(
      {
        accountId,
        platform,
      },
    ).lean({ virtuals: true })
    return oauth2Credential
  }

  async upsertOne(accountId: string, platform: AccountType | 'meta', newData: Partial<OAuth2Credential>): Promise<boolean> {
    const persistResult = await this.oauth2CredentialModel.updateOne(
      {
        accountId,
        platform,
      },
      newData,
      {
        upsert: true,
      },
    )
    return (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
  }

  async delOne(accountId: string, platform: AccountType | 'meta') {
    await this.oauth2CredentialModel.deleteOne({
      accountId,
      platform,
    }).exec()
  }
}
