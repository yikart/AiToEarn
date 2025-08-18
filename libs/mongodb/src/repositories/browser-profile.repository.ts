import { Pagination } from '@aitoearn/common'
import { InjectModel } from '@nestjs/mongoose'
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
}
