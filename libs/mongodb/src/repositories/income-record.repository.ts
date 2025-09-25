import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { IncomeRecordStatus, IncomeRecordType } from '../enums'
import { IncomeRecord } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListIncomeRecordParams extends Pagination {
  userId?: string
  type?: IncomeRecordType
  status?: IncomeRecordStatus
  withdrawId?: string
  relId?: string
  createdAt?: RangeFilter<Date>
}

export interface ListIncomeRecordByUserIdParams {
  userId: string
  type?: IncomeRecordType
  status?: IncomeRecordStatus
  withdrawId?: string
  relId?: string
}

export interface ListIncomeRecordByStatusParams {
  status: IncomeRecordStatus
  type?: IncomeRecordType
  createdAt?: RangeFilter<Date>
}

export class IncomeRecordRepository extends BaseRepository<IncomeRecord> {
  constructor(
    @InjectModel(IncomeRecord.name) private readonly incomeRecordModel: Model<IncomeRecord>,
  ) {
    super(incomeRecordModel)
  }

  async listWithPagination(params: ListIncomeRecordParams) {
    const { page, pageSize, userId, type, status, withdrawId, relId, createdAt } = params

    const filter: FilterQuery<IncomeRecord> = {}
    if (userId)
      filter.userId = userId
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (withdrawId)
      filter.withdrawId = withdrawId
    if (relId)
      filter.relId = relId
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

  async listByUserId(params: ListIncomeRecordByUserIdParams): Promise<IncomeRecord[]> {
    const { userId, type, status, withdrawId, relId } = params
    const filter: FilterQuery<IncomeRecord> = {
      userId,
    }
    if (type)
      filter.type = type
    if (status)
      filter.status = status
    if (withdrawId)
      filter.withdrawId = withdrawId
    if (relId)
      filter.relId = relId

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async listByStatus(params: ListIncomeRecordByStatusParams): Promise<IncomeRecord[]> {
    const { status, type, createdAt } = params
    const filter: FilterQuery<IncomeRecord> = {
      status,
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

  async getByWithdrawId(withdrawId: string): Promise<IncomeRecord | null> {
    return await this.findOne({ withdrawId })
  }

  async getByRelId(relId: string): Promise<IncomeRecord | null> {
    return await this.findOne({ relId })
  }

  async updateStatusById(id: string, status: IncomeRecordStatus): Promise<IncomeRecord | null> {
    return await this.updateById(id, { status })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }
}
