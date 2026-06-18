import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter, UserType } from '@yikart/common'
import { FilterQuery, Model, UpdateQuery } from 'mongoose'
import { AiLogChannel, AiLogStatus, AiLogType } from '../enums'
import { AiLog } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAiLogParams extends Pagination {
  userId?: string
  userType?: UserType
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  channel?: AiLogChannel
  channels?: AiLogChannel[]
  createdAt?: RangeFilter<Date>
}

export interface ListAiLogFilter {
  userId?: string
  userType?: UserType
  type?: AiLogType
  status?: AiLogStatus
  model?: string
  channel?: AiLogChannel
  channels?: AiLogChannel[]
  createdAt?: RangeFilter<Date>
}

export class AiLogRepository extends BaseRepository<AiLog> {
  constructor(
    @InjectModel(AiLog.name) aiLogModel: Model<AiLog>,
  ) {
    super(aiLogModel)
  }

  async listWithPagination(params: ListAiLogParams) {
    const { page, pageSize, userId, userType, type, status, model, channel, channels, createdAt } = params

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
    if (channel)
      filter.channel = channel
    else if (channels)
      filter.channel = { $in: channels }
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
    const { userId, userType, type, status, model, channel, channels, createdAt } = params

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
    if (channel)
      filter.channel = channel
    else if (channels)
      filter.channel = { $in: channels }
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

  async listByStatusAndStartedAtBefore(status: AiLogStatus, startedBefore: Date, limit: number) {
    return await this.find(
      {
        status,
        startedAt: { $lt: startedBefore },
      },
      { sort: { startedAt: 1 }, limit },
    )
  }

  async updateByIdAndStatus(id: string, status: AiLogStatus, update: UpdateQuery<AiLog>) {
    return await this.updateOne({ _id: id, status }, update)
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

  async listByUserIdAndTypeAndStatusAndRequestVersionAndCreatedAt(
    userId: string,
    type: AiLogType,
    status: AiLogStatus,
    requestVersion: string,
    startAt: Date,
    limit: number,
  ) {
    return await this.find(
      {
        userId,
        type,
        status,
        'request.version': requestVersion,
        'createdAt': { $gte: startAt },
      },
      { sort: { createdAt: -1 }, limit },
    )
  }

  async listUserIdsByTypeAndStatusAndUpdatedAt(type: AiLogType, status: AiLogStatus, startAt: Date): Promise<string[]> {
    return await this.model.distinct('userId', {
      type,
      status,
      updatedAt: { $gte: startAt },
    }).exec()
  }
}
