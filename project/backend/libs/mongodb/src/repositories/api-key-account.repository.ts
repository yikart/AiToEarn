import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ApiKeyAccount } from '../schemas'
import { BaseRepository } from './base.repository'

export class ApiKeyAccountRepository extends BaseRepository<ApiKeyAccount> {
  constructor(
    @InjectModel(ApiKeyAccount.name) apiKeyAccountModel: Model<ApiKeyAccount>,
  ) {
    super(apiKeyAccountModel)
  }

  async list(apiKey: string) {
    return await this.find({ apiKey })
  }
}
