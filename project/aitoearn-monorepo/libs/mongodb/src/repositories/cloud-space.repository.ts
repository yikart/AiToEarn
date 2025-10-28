import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { CloudSpaceRegion, CloudSpaceStatus } from '../enums'
import { CloudSpace } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListCloudSpaceParams extends Pagination {
  userId?: string
  region?: CloudSpaceRegion
  status?: CloudSpaceStatus
}

export interface ListCloudSpaceByUserIdParams {
  userId: string
  region?: CloudSpaceRegion
  status?: CloudSpaceStatus
}

export interface ListCloudSpacesByStatusParams {
  status: CloudSpaceStatus
  expiredAt?: RangeFilter<Date>
}

export class CloudSpaceRepository extends BaseRepository<CloudSpace> {
  constructor(
    @InjectModel(CloudSpace.name) cloudSpaceModel: Model<CloudSpace>,
  ) {
    super(cloudSpaceModel)
  }

  async listWithPagination(params: ListCloudSpaceParams) {
    const { page, pageSize, userId, region, status } = params

    const filter: FilterQuery<CloudSpace> = {}
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

  async listByStatus(params: ListCloudSpacesByStatusParams): Promise<CloudSpace[]> {
    const { status, expiredAt } = params

    const filter: FilterQuery<CloudSpace> = {
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
        filter.expiredAt = { $gte: start }
      }
    }

    return await this.model
      .find(filter)
      .sort({ expiredAt: 1 })
      .exec()
  }

  async listByUserId(params: ListCloudSpaceByUserIdParams) {
    const { userId, region, status } = params
    const filter: FilterQuery<CloudSpace> = {
      userId,
    }
    if (region)
      filter.region = region
    if (status)
      filter.status = status

    return await this.model
      .find(filter)
      .sort()
      .exec()
  }
}
