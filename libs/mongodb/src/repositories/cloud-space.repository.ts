import { InjectModel } from '@nestjs/mongoose'
import { CloudSpaceRegion, CloudSpaceStatus, Pagination } from '@yikart/common'
import { Document, FilterQuery, Model } from 'mongoose'
import { CloudSpace } from '../schemas'
import { BaseRepository } from './base.repository'

export type CloudSpaceDocument = CloudSpace & Document

export interface ListCloudSpaceParams extends Pagination {
  userId?: string
  region?: CloudSpaceRegion
  status?: CloudSpaceStatus
}

export class CloudSpaceRepository extends BaseRepository<CloudSpaceDocument> {
  constructor(
    @InjectModel(CloudSpace.name) cloudSpaceModel: Model<CloudSpaceDocument>,
  ) {
    super(cloudSpaceModel)
  }

  async listWithPagination(params: ListCloudSpaceParams): Promise<[CloudSpaceDocument[], number]> {
    const { page, pageSize, userId, region, status } = params

    const filter: FilterQuery<CloudSpaceDocument> = {}
    if (userId)
      filter.userId = userId
    if (region)
      filter.region = region
    if (status)
      filter.status = status

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }
}
