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

export interface FindCloudSpacesByDateRangeParams {
  status: CloudSpaceStatus
  expiredAt?: [Date, Date] | [undefined, Date] | [Date, undefined]
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

  async listByStatus(params: FindCloudSpacesByDateRangeParams): Promise<CloudSpaceDocument[]> {
    const { status, expiredAt } = params

    const filter: FilterQuery<CloudSpaceDocument> = {
      status,
    }

    if (expiredAt) {
      const [start, end] = expiredAt
      if (start && end) {
        filter.expiredAt = {
          $gt: start,
          $lte: end,
        }
      }
      else if (end) {
        filter.expiredAt = { $lte: end }
      }
      else if (start) {
        filter.expiredAt = { $gt: start }
      }
    }

    return await this.model
      .find(filter)
      .sort({ expiredAt: 1 })
      .exec()
  }
}
