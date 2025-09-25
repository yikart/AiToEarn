import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { PointsRecord } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListPointsRecordParams extends Pagination {
  userId?: string
  type?: string
  createdAt?: RangeFilter<Date>
}

export interface ListPointsRecordByUserIdParams {
  userId: string
  type?: string
  createdAt?: RangeFilter<Date>
}

export interface ListPointsRecordByTypeParams {
  type: string
  createdAt?: RangeFilter<Date>
}

export class PointsRecordRepository extends BaseRepository<PointsRecord> {
  constructor(
    @InjectModel(PointsRecord.name) private readonly pointsRecordModel: Model<PointsRecord>,
  ) {
    super(pointsRecordModel)
  }

  async listWithPagination(params: ListPointsRecordParams) {
    const { page, pageSize, userId, type, createdAt } = params

    const filter: FilterQuery<PointsRecord> = {}
    if (userId)
      filter.userId = userId
    if (type)
      filter.type = type
    if (createdAt) {
      filter.createdAt = {}
      if (createdAt[0])
        filter.createdAt.$gte = createdAt[0]
      if (createdAt[1])
        filter.createdAt.$lte = createdAt[1]
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async listByUserId(params: ListPointsRecordByUserIdParams): Promise<PointsRecord[]> {
    const { userId, type, createdAt } = params
    const filter: FilterQuery<PointsRecord> = {
      userId,
    }
    if (type)
      filter.type = type
    if (createdAt) {
      filter.createdAt = {}
      if (createdAt[0])
        filter.createdAt.$gte = createdAt[0]
      if (createdAt[1])
        filter.createdAt.$lte = createdAt[1]
    }

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async listByType(params: ListPointsRecordByTypeParams): Promise<PointsRecord[]> {
    const { type, createdAt } = params
    const filter: FilterQuery<PointsRecord> = {
      type,
    }
    if (createdAt) {
      filter.createdAt = {}
      if (createdAt[0])
        filter.createdAt.$gte = createdAt[0]
      if (createdAt[1])
        filter.createdAt.$lte = createdAt[1]
    }

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async getLatestByUserId(userId: string): Promise<PointsRecord | null> {
    return await this.findOne({ userId }, { sort: { createdAt: -1 } })
  }

  async getTotalPointsByUserId(userId: string): Promise<number> {
    const latest = await this.getLatestByUserId(userId)
    return latest?.balance || 0
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }
}
