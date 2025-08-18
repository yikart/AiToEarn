import { BrowserEnvironmentRegion, BrowserEnvironmentStatus, Pagination } from '@aitoearn/common'
import { InjectModel } from '@nestjs/mongoose'
import { Document, FilterQuery, Model } from 'mongoose'
import { BrowserEnvironment } from '../schemas'
import { BaseRepository } from './base.repository'

export type BrowserEnvironmentDocument = BrowserEnvironment & Document

export interface ListBrowserEnvironmentParams extends Pagination {
  userId?: string
  region?: BrowserEnvironmentRegion
  status?: BrowserEnvironmentStatus
  profileId?: string
}

export class BrowserEnvironmentRepository extends BaseRepository<BrowserEnvironmentDocument> {
  constructor(
    @InjectModel(BrowserEnvironment.name) browserEnvironmentModel: Model<BrowserEnvironmentDocument>,
  ) {
    super(browserEnvironmentModel)
  }

  async listWithPagination(params: ListBrowserEnvironmentParams): Promise<[BrowserEnvironmentDocument[], number]> {
    const { page, pageSize, userId, region, status, profileId } = params

    const filter: FilterQuery<BrowserEnvironmentDocument> = {}
    if (userId)
      filter.userId = userId
    if (region)
      filter.region = region
    if (status)
      filter.status = status
    if (profileId)
      filter.profileId = profileId

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }
}
