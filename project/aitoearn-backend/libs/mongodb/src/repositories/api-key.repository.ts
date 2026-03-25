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

  async getByKeyHash(keyHash: string) {
    return await this.findOne({ keyHash })
  }

  async listByUserId(userId: string) {
    return await this.find({ userId })
  }

  async updateLastUsedAt(id: string) {
    await this.updateById(id, { lastUsedAt: new Date() })
  }

  async deleteByIdAndUserId(id: string, userId: string) {
    await this.deleteOne({ _id: id, userId })
  }
}
