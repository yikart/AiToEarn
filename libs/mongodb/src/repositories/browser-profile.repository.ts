import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { Document, FilterQuery, Model } from 'mongoose'
import { BrowserProfile } from '../schemas'
import { BaseRepository } from './base.repository'

export type BrowserProfileDocument = BrowserProfile & Document

export interface ListBrowserProfileParams extends Pagination {
  accountId?: string
  profileId?: string
  environmentId?: string
}

export class BrowserProfileRepository extends BaseRepository<BrowserProfileDocument> {
  constructor(
    @InjectModel(BrowserProfile.name) browserProfileModel: Model<BrowserProfileDocument>,
  ) {
    super(browserProfileModel)
  }

  async listWithPagination(params: ListBrowserProfileParams): Promise<[BrowserProfileDocument[], number]> {
    const { page, pageSize, accountId, profileId, environmentId } = params

    const filter: FilterQuery<BrowserProfileDocument> = {}
    if (accountId)
      filter.accountId = accountId
    if (profileId)
      filter.profileId = profileId
    if (environmentId)
      filter.environmentId = environmentId

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }

  async findByEnvironmentId(environmentId: string): Promise<BrowserProfileDocument[]> {
    return await this.find({ environmentId })
  }

  async listByEnvironmentId(environmentId: string): Promise<BrowserProfileDocument[]> {
    return await this.findByEnvironmentId(environmentId)
  }

  async getByEnvironmentId(environmentId: string): Promise<BrowserProfileDocument | null> {
    return await this.findOne({ environmentId })
  }

  async deleteByEnvironmentId(environmentId: string): Promise<void> {
    await this.deleteMany({ environmentId })
  }
}
