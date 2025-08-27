import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { Document, FilterQuery, Model } from 'mongoose'
import { BrowserProfile } from '../schemas'
import { BaseRepository } from './base.repository'

export type BrowserProfileDocument = BrowserProfile & Document

export interface ListBrowserProfileParams extends Pagination {
  accountId?: string
  profileId?: string
  cloudSpaceId?: string
}

export class BrowserProfileRepository extends BaseRepository<BrowserProfileDocument> {
  constructor(
    @InjectModel(BrowserProfile.name) browserProfileModel: Model<BrowserProfileDocument>,
  ) {
    super(browserProfileModel)
  }

  async listWithPagination(params: ListBrowserProfileParams): Promise<[BrowserProfileDocument[], number]> {
    const { page, pageSize, accountId, profileId, cloudSpaceId } = params

    const filter: FilterQuery<BrowserProfileDocument> = {}
    if (accountId)
      filter.accountId = accountId
    if (profileId)
      filter.profileId = profileId
    if (cloudSpaceId)
      filter.cloudSpaceId = cloudSpaceId

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }

  async findByCloudSpaceId(cloudSpaceId: string): Promise<BrowserProfileDocument[]> {
    return await this.find({ cloudSpaceId })
  }

  async listByCloudSpaceId(cloudSpaceId: string): Promise<BrowserProfileDocument[]> {
    return await this.findByCloudSpaceId(cloudSpaceId)
  }

  async getByCloudSpaceId(cloudSpaceId: string): Promise<BrowserProfileDocument | null> {
    return await this.findOne({ cloudSpaceId })
  }

  async deleteByCloudSpaceId(cloudSpaceId: string): Promise<void> {
    await this.deleteMany({ cloudSpaceId })
  }
}
