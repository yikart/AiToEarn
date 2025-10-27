import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { BrowserProfile } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListBrowserProfileParams extends Pagination {
  accountId?: string
  profileId?: string
  cloudSpaceId?: string
}

export class BrowserProfileRepository extends BaseRepository<BrowserProfile> {
  constructor(
    @InjectModel(BrowserProfile.name) browserProfileModel: Model<BrowserProfile>,
  ) {
    super(browserProfileModel)
  }

  async listWithPagination(params: ListBrowserProfileParams) {
    const { page, pageSize, accountId, profileId, cloudSpaceId } = params

    const filter: FilterQuery<BrowserProfile> = {}
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

  async listByCloudSpaceId(cloudSpaceId: string): Promise<BrowserProfile[]> {
    return await this.find({ cloudSpaceId })
  }

  async getByCloudSpaceId(cloudSpaceId: string): Promise<BrowserProfile | null> {
    return await this.findOne({ cloudSpaceId })
  }

  async deleteByCloudSpaceId(cloudSpaceId: string): Promise<void> {
    await this.deleteMany({ cloudSpaceId })
  }
}
