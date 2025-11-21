import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ApiKey } from '../schemas'
import { BaseRepository } from './base.repository'

export class ApiKeyRepository extends BaseRepository<ApiKey> {
  constructor(
    @InjectModel(ApiKey.name) apiKeyModel: Model<ApiKey>,
  ) {
    super(apiKeyModel)
  }

  async getByKey(key: string) {
    return await this.findOne({ key })
  }

  async list(userId: string) {
    return await this.find({ userId })
  }
}
