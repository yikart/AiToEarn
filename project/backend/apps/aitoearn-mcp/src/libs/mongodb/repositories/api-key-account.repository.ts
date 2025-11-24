import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { Pagination } from '../../../libs/common'
import { ApiKeyAccount } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListApiKeyAccountsParams extends Pagination {
  apiKey: string
}

export interface ListApiKeyAccountsFilter {
  apiKey: string
}

export class ApiKeyAccountRepository extends BaseRepository<ApiKeyAccount> {
  constructor(
    @InjectModel(ApiKeyAccount.name) apiKeyAccountModel: Model<ApiKeyAccount>,
  ) {
    super(apiKeyAccountModel)
  }

  async deleteByApiKey(apiKey: string) {
    return await this.deleteMany({ apiKey })
  }

  async deleteByAccountId(apiKey: string, accountId: string) {
    return await this.deleteOne({ accountId, apiKey })
  }

  async countApiKeyAccounts(filter: FilterQuery<ApiKeyAccount>) {
    return await this.count(filter)
  }

  async listWithPagination(params: ListApiKeyAccountsParams) {
    const { apiKey, page, pageSize } = params

    const filter: FilterQuery<ApiKeyAccount> = { apiKey }
    return await this.findWithPagination({ page, pageSize, filter })
  }

  async list(filter: ListApiKeyAccountsFilter) {
    return await this.find(filter)
  }
}
