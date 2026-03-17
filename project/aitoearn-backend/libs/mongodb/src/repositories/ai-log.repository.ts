import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter, UserType } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AiLogChannel, AiLogStatus, AiLogType } from '../enums'
import { AiLog } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAiLogParams extends Pagination {
  userId?: string
  userType?: UserType
  libraryId?: string
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  channel?: AiLogChannel
  createdAt?: RangeFilter<Date>
}

export interface ListAiLogFilter {
  userId?: string
  userType?: UserType
  libraryId?: string
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  channel?: AiLogChannel
  createdAt?: RangeFilter<Date>
}

export class AiLogRepository extends BaseRepository<AiLog> {
  constructor(
    @InjectModel(AiLog.name) aiLogModel: Model<AiLog>,
  ) {
    super(aiLogModel)
  }

  async listWithPagination(params: ListAiLogParams) {
    const { page, pageSize, userId, userType, libraryId, type, status, model, channel, createdAt } = params

    const filter: FilterQuery<AiLog> = {}
    if (userId)
      filter.userId = userId
    if (userType)
      filter.userType = userType
    if (libraryId)
      filter.libraryId = libraryId
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (model)
      filter.model = model
    if (channel)
      filter.channel = channel
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

  async list(params: ListAiLogFilter) {
    const { userId, userType, libraryId, type, status, model, channel, createdAt } = params

    const filter: FilterQuery<AiLog> = {}
    if (userId)
      filter.userId = userId
    if (userType)
      filter.userType = userType
    if (libraryId)
      filter.libraryId = libraryId
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (model)
      filter.model = model
    if (channel)
      filter.channel = channel
    if (createdAt) {
      filter.createdAt = {}
      if (createdAt[0])
        filter.createdAt.$gte = createdAt[0]
      if (createdAt[1])
        filter.createdAt.$lte = createdAt[1]
    }

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async listGeneratingByType(type: AiLogType, channel?: AiLogChannel) {
    const filter: FilterQuery<AiLog> = {
      type,
      status: AiLogStatus.Generating,
      taskId: { $exists: true, $ne: null },
    }
    if (channel)
      filter.channel = channel
    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async getByTaskId(taskId: string) {
    return await this.findOne({ taskId })
  }

  async getByIdAndUserId(id: string, userId: string, userType: UserType) {
    return await this.findOne({ _id: id, userId, userType })
  }

  async listByIdsAndUserId(ids: string[], userId: string, userType: UserType): Promise<AiLog[]> {
    return this.find(
      { _id: { $in: ids }, userId, userType },
      { sort: { createdAt: -1 } },
    )
  }

  async countByUserIdAndStatus(userId: string, userType: UserType, type: AiLogType, status: AiLogStatus): Promise<number> {
    return this.count({ userId, userType, type, status })
  }

  async getByIdAndLibraryId(id: string, libraryId: string, userType: UserType): Promise<AiLog | null> {
    return this.findOne({ _id: id, libraryId, userType })
  }

  async listByIdsAndLibraryId(ids: string[], libraryId: string, userType: UserType): Promise<AiLog[]> {
    return this.find(
      { _id: { $in: ids }, libraryId, userType },
      { sort: { createdAt: -1 } },
    )
  }

  async countByLibraryIdAndStatus(libraryId: string, userType: UserType, type: AiLogType, status: AiLogStatus): Promise<number> {
    return this.count({ libraryId, userType, type, status })
  }

  async getSuccessTotalAmount(startDate: Date, endDate: Date) {
    const result = await this.model.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: AiLogStatus.Success } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ])
    return result[0]?.total ?? 0
  }
}
