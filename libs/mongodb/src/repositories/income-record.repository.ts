import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { IncomeStatus, IncomeType } from '../enums'
import { IncomeRecord, User } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListIncomeRecordParams extends Pagination {
  userId?: string
  type?: IncomeType
  status?: IncomeStatus
  withdrawId?: string
  relId?: string
  createdAt?: RangeFilter<Date>
}

export interface ListIncomeRecordByUserIdParams {
  userId: string
  type?: IncomeType
  status?: IncomeType
  withdrawId?: string
  relId?: string
}

export interface ListIncomeRecordByStatusParams {
  status: IncomeStatus
  type?: IncomeType
  createdAt?: RangeFilter<Date>
}

export class IncomeRecordRepository extends BaseRepository<IncomeRecord> {
  constructor(
    @InjectModel(IncomeRecord.name) private readonly incomeRecordModel: Model<IncomeRecord>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {
    super(incomeRecordModel)
  }

  /**
   * 增加收入
   * @param data
   */
  async add(data: {
    userId: string
    amount: number
    type: IncomeType
    description?: string
    metadata?: Record<string, any>
    relId?: string
    withdrawId?: string
  }): Promise<void> {
    await this.userModel.db.transaction(async () => {
      await this.userModel.updateOne(
        { _id: data.userId },
        { $inc: { income: data.amount, totalIncome: data.amount } },
      )
      return await this.incomeRecordModel.create(data)
    })
  }

  /**
   * 扣减
   * @param data 扣减
   */
  async deduct(data: {
    userId: string
    amount: number
    type: IncomeType
    description?: string
    metadata?: Record<string, any>
    relId?: string
    withdrawId?: string
  }): Promise<void> {
    const { userId, amount } = data

    await this.userModel.db.transaction(async () => {
      const result = await this.userModel.updateOne(
        { _id: userId, income: { $gte: amount } }, // 查询条件包含余额检查
        {
          $inc: { income: -amount },
        },
      )
      if (!result.matchedCount)
        throw new Error('not enough balance')

      // 删除redis缓存
      // this.redisService.del(`UserInfo:${userId}`)

      data.amount = -amount

      await this.incomeRecordModel.create({ status: IncomeStatus.DO, ...data })
    })
  }

  /**
   * 获取用户积分余额
   * @param userId 用户ID
   * @returns 用户积分余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec()
    return user?.income || 0
  }

  // 提现
  async withdraw(id: string, withdrawId?: string): Promise<boolean> {
    const res = await this.incomeRecordModel.updateOne({ _id: id }, { status: IncomeStatus.DO, withdrawId }).exec()
    return res.modifiedCount > 0
  }

  // 获取用户全部未提现的收入
  async getAllWithdrawableIncome(userId: string): Promise<IncomeRecord[]> {
    return await this.incomeRecordModel.find({ status: IncomeStatus.WAIT, userId }).exec()
  }

  /**
   * 获取记录信息
   * @param id 用户ID
   * @returns 用户积分余额
   */
  async getRecordInfo(id: string): Promise<IncomeRecord | null> {
    const res = await this.incomeRecordModel.findById(id).exec()
    return res
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

  async updateStatusById(id: string, status: IncomeStatus): Promise<IncomeRecord | null> {
    return await this.updateById(id, { status })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }
}
