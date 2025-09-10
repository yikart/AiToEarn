import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter, UserType } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AiLogStatus, AiLogType } from '../enums'
import { AiLog } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAiLogParams extends Pagination {
  userId?: string
  userType?: UserType
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  createdAt?: RangeFilter<Date>
}

export interface ListAiLogFilter {
  userId?: string
  userType?: UserType
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  createdAt?: RangeFilter<Date>
}

export class AiLogRepository extends BaseRepository<AiLog> {
  constructor(
    @InjectModel(AiLog.name) aiLogModel: Model<AiLog>,
  ) {
    super(aiLogModel)
  }

  async listWithPagination(params: ListAiLogParams) {
    const { page, pageSize, userId, userType, type, status, model, createdAt } = params

    const filter: FilterQuery<AiLog> = {}
    if (userId)
      filter.userId = userId
    if (userType)
      filter.userType = userType
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (model)
      filter.model = model
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

  async list(params: ListAiLogFilter): Promise<AiLog[]> {
    const { userId, userType, type, status, model, createdAt } = params

    const filter: FilterQuery<AiLog> = {}
    if (userId)
      filter.userId = userId
    if (userType)
      filter.userType = userType
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (model)
      filter.model = model
    if (createdAt) {
      filter.createdAt = {}
      if (createdAt[0])
        filter.createdAt.$gte = createdAt[0]
      if (createdAt[1])
        filter.createdAt.$lte = createdAt[1]
    }

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async getByTaskId(taskId: string): Promise<AiLog | null> {
    return await this.findOne({ taskId })
  }

  async getByIdAndUserId(id: string, userId: string, userType: UserType): Promise<AiLog | null> {
    return await this.findOne({ id, userId, userType })
  }
}
