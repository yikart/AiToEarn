import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { ApiKey } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListApiKeysParams extends Pagination {
  userId?: string
}
export interface ListApiKeysFilter {
  userId?: string
}
export class ApiKeyRepository extends BaseRepository<ApiKey> {
  constructor(
    @InjectModel(ApiKey.name) apiKeyModel: Model<ApiKey>,
  ) {
    super(apiKeyModel)
  }

  async listWithPagination(params: ListApiKeysParams) {
    const { page, pageSize, userId } = params
    const filter: FilterQuery<ApiKey> = {}
    if (userId)
      filter.userId = userId
    return await this.findWithPagination({ page, pageSize, filter })
  }

  async deleteByApiKey(key: string) {
    return await this.deleteOne({ key })
  }

  async getByApiKey(key: string) {
    return await this.findOne({ key })
  }

  async getByKey(userId: string, key: string) {
    return await this.findOne({ userId, key })
  }

  async list(userId: string) {
    return await this.find({ userId })
  }

  async updateDesc(key: string, desc: string) {
    return await this.updateOne({ key }, { desc })
  }
}
