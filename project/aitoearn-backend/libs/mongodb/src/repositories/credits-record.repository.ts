import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreditsType, Pagination, RangeFilter } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { CreditsRecord } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListCreditsRecordParams extends Pagination {
  userId?: string
  type?: CreditsType
  createdAt?: RangeFilter<Date>
}

export class CreditsRecordRepository extends BaseRepository<CreditsRecord> {
  logger = new Logger(CreditsRecordRepository.name)
  constructor(
    @InjectModel(CreditsRecord.name) private readonly creditsRecordModel: Model<CreditsRecord>,
  ) {
    super(creditsRecordModel)
  }

  async listWithPagination(params: ListCreditsRecordParams) {
    const { page, pageSize, userId, type, createdAt } = params

    const filter: FilterQuery<CreditsRecord> = {}
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

  async listByUserIdAndType(userId: string, type: CreditsType) {
    return await this.creditsRecordModel
      .find({
        userId,
        type,
        balance: { $gt: 0 },
      })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
      .exec()
  }

  async listValidCredits(userId: string) {
    const now = new Date()
    return await this.creditsRecordModel
      .find({
        userId,
        amount: { $gt: 0 },
        balance: { $gt: 0 },
        $or: [
          { expiredAt: null },
          { expiredAt: { $gte: now } },
        ],
      })
      .sort({ expiredAt: 1, createdAt: 1 })
      .lean({ virtuals: true })
      .exec()
  }

  async listExpiredCredits() {
    const now = new Date()
    return await this.creditsRecordModel
      .find({
        amount: { $gt: 0 },
        balance: { $gt: 0 },
        expiredAt: { $ne: null, $lt: now },
      })
      .lean({ virtuals: true })
      .exec()
  }

  /**
   * 检查指定时间范围内是否存在指定类型的记录
   * @param userId 用户ID
   * @param type Credits类型
   * @param startDate 开始时间（包含）
   * @param endDate 结束时间（包含）
   * @returns 如果存在记录返回 true，否则返回 false
   */
  async hasRecordInTimeRange(
    userId: string,
    type: CreditsType,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const count = await this.creditsRecordModel
      .countDocuments({
        userId,
        type,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec()
    return count > 0
  }

  /**
   * 查询用户已过期但 balance > 0 的记录
   * @param userId 用户ID
   * @returns 已过期但余额大于0的记录列表
   */
  async listUserExpiredCredits(userId: string): Promise<CreditsRecord[]> {
    const now = new Date()
    return await this.creditsRecordModel
      .find({
        userId,
        amount: { $gt: 0 },
        balance: { $gt: 0 },
        expiredAt: { $ne: null, $lt: now },
      })
      .lean({ virtuals: true })
      .exec()
  }

  /**
   * 批量将指定记录的 balance 置为 0
   * @param recordIds 记录ID数组
   */
  async resetBalances(recordIds: string[]): Promise<void> {
    if (recordIds.length === 0) {
      return
    }
    await this.creditsRecordModel
      .updateMany(
        { _id: { $in: recordIds } },
        { $set: { balance: 0 } },
      )
      .exec()
  }

  /**
   * 获取用户最新的 VipMonthly Credits 过期时间
   * @param userId 用户ID
   * @returns 最新的过期时间，如果没有则返回 null
   */
  async getLatestVipMonthlyExpireDateByUserId(userId: string): Promise<Date | null> {
    const record = await this.creditsRecordModel
      .findOne({
        userId,
        type: CreditsType.VipMonthly,
        amount: { $gt: 0 },
        expiredAt: { $ne: null },
      })
      .sort({ expiredAt: -1 })
      .lean({ virtuals: true })
      .exec()
    return record?.expiredAt || null
  }
}
