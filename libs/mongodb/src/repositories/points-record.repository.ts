import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Pagination, RangeFilter } from '@yikart/common'
import dayjs from 'dayjs'
import * as _ from 'lodash'
import { FilterQuery, Model } from 'mongoose'
import { IPointStatus, PointsRecord, User } from '../schemas'
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
  logger = new Logger(PointsRecordRepository.name)
  constructor(
    @InjectModel(PointsRecord.name) private readonly pointsRecordModel: Model<PointsRecord>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
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

  async findVipOpintsAddRepordOfMonth(userId: string) {
    const startTime = dayjs().subtract(30, 'day').toDate()
    const time = [startTime, new Date()]
    const list = await this.pointsRecordModel
      .find({
        userId,
        createdAt: { $gte: time[0], $lte: time[1] },
        type: 'vip_points',
      })
      .sort({ createdAt: -1 })
      .exec()

    return list
  }

  async addPoints(
    user: User,
    data: {
      amount: number
      type: string
      description?: string
      metadata?: Record<string, any>
    },
  ): Promise<void> {
    const { amount, type, description, metadata } = data

    await this.userModel.db.transaction(async () => {
      await this.userModel.updateOne(
        { _id: user.id },
        { $inc: { score: amount } },
      )

      return await this.pointsRecordModel.create([
        {
          userId: user.id,
          amount,
          balance: user.score + amount,
          type,
          description,
          metadata,
        },
      ])
    })
  }

  /**
   * 扣减积分
   * @param data 扣减积分的数据
   */
  async deductPoints(
    user: User,
    data: {
      amount: number
      type: string
      description?: string
      metadata?: Record<string, any>
    },
  ): Promise<void> {
    const { amount, type, description, metadata } = data

    await this.userModel.db.transaction(async () => {
      await this.userModel.updateOne(
        { _id: user.id, score: { $gte: amount } }, // 查询条件包含余额检查
        {
          $inc: { score: -amount }, // 原子性减少积分
        },
      )

      await this.pointsRecordModel.create([
        {
          userId: user.id,
          amount: -amount,
          balance: user.score - amount,
          type,
          description,
          metadata,
          createdAt: new Date(),
        },
      ])
    })
  }

  async diKouCostByUser(user: User, updatedAt: any) {
    const { id: userId } = user
    try {
      // 查询昨天该用户的所有花费的总和
      const $match = {
        userId,
        updatedAt,
        status: IPointStatus.FREE,
        amount: { $lt: 0 },
      }
      const $group = { _id: null, pointCost: { $sum: '$amount' } }
      const data = await this.pointsRecordModel.aggregate([
        { $match },
        { $group },
      ])

      // 修复：正确获取pointCost值
      let pointCost = 0
      if (!_.isEmpty(data) && data[0] && _.has(data[0], 'pointCost')) {
        pointCost = Math.abs(data[0].pointCost) // 取绝对值，因为花费是负数
      }

      if (pointCost <= 0) {
        this.logger.debug(`No cost points found for user ${userId}`)
        return
      }

      this.logger.log(`Processing cost deduction for user ${userId}, cost: ${pointCost}`)

      const arr: any = []
      // 标记花费记录为已抵扣
      arr.push(this.pointsRecordModel.updateMany($match, { $set: { status: IPointStatus.TOTAL_DI_KOU } }))

      // 找到最近一年内所有新增的未被抵扣的积分记录，按照创建时间倒序依次抵扣直到抵扣结束
      const today = dayjs().startOf('day').valueOf()
      const createdAt = {
        $gt: dayjs(today).subtract(1, 'y').valueOf(),
        $lt: today,
      }
      const condition = {
        userId,
        status: { $in: [IPointStatus.FREE, IPointStatus.PART_DI_KOU] },
        amount: { $gt: 0 },
        createdAt,
      }

      const cursor = this.pointsRecordModel
        .find(condition, 'id amount usedForDiKou status createdAt')
        .sort({ createdAt: -1 })
        .cursor()

      let remainingCost = pointCost
      for (let record: any = await cursor.next(); record !== null && remainingCost > 0; record = await cursor.next()) {
        const { _id: recordId, amount, usedForDiKou } = record
        const availableAmount = amount - (usedForDiKou || 0)

        if (availableAmount <= 0)
          continue

        // 该条积分增加记录可以被完全抵扣
        if (remainingCost >= availableAmount) {
          remainingCost -= availableAmount
          arr.push(
            this.pointsRecordModel.findByIdAndUpdate(
              recordId,
              { $set: { usedForDiKou: amount, status: IPointStatus.TOTAL_DI_KOU } },
            ),
          )
        }
        else {
          // 该条积分增加记录不能被完全抵扣
          const newUsedForDiKou = (usedForDiKou || 0) + remainingCost
          arr.push(
            this.pointsRecordModel.findByIdAndUpdate(
              recordId,
              { $set: { usedForDiKou: newUsedForDiKou, status: IPointStatus.PART_DI_KOU } },
            ),
          )
          remainingCost = 0
        }
      }

      await Promise.all(arr)
      this.logger.log(`Cost deduction completed for user ${userId}, processed cost: ${pointCost - remainingCost}`)
    }
    catch (error) {
      this.logger.error(`Error processing cost deduction for user ${userId}`, error)
      throw error
    }
  }

  async getPointBySub(user: User) {
    const { id: userId, score } = user
    try {
      const arr: any = []
      // 获取今天即将过期的积分（一年前获取的积分）
      const oneYearAgo = dayjs().startOf('day').subtract(1, 'y').valueOf()
      const createdAt = {
        $gte: dayjs(oneYearAgo).subtract(1, 'd').valueOf(),
        $lt: oneYearAgo,
      }

      // 查询完全未抵扣的积分记录
      const $match = { userId, createdAt, status: IPointStatus.FREE, amount: { $gt: 0 } }
      const $group = { _id: null, pointGet: { $sum: '$amount' } }
      const data = await this.pointsRecordModel.aggregate([
        { $match },
        { $group },
      ])

      // 修复：正确获取pointGet值
      let pointGet = 0
      if (!_.isEmpty(data) && data[0] && _.has(data[0], 'pointGet')) {
        pointGet = data[0].pointGet
      }

      // 查询部分抵扣的积分记录
      const condition = { userId, createdAt, status: IPointStatus.PART_DI_KOU, amount: { $gt: 0 } }
      const PartDiKou: any = await this.pointsRecordModel.findOne(condition, 'id amount usedForDiKou status createdAt')

      if (!_.isEmpty(PartDiKou)) {
        const { _id: recordId, amount, usedForDiKou } = PartDiKou
        const remainingAmount = amount - (usedForDiKou || 0)
        if (remainingAmount > 0) {
          pointGet += remainingAmount
          // 标记为完全抵扣
          arr.push(
            this.pointsRecordModel.findByIdAndUpdate(
              recordId,
              { $set: { status: IPointStatus.TOTAL_DI_KOU, usedForDiKou: amount } },
            ),
          )
        }
      }

      // 标记所有未抵扣的积分记录为已抵扣
      arr.push(this.pointsRecordModel.updateMany($match, { $set: { status: IPointStatus.TOTAL_DI_KOU } }))

      if (pointGet <= 0) {
        this.logger.debug(`No expired points found for user ${userId}`)
        return
      }

      // 计算新的积分余额
      const newBalance = Math.max(0, score - pointGet)

      // 创建积分过期记录
      const pointsRecord = {
        userId,
        amount: -pointGet,
        balance: newBalance,
        type: 'system_point_expire',
        description: `积分获取后有效期为一年，系统积分：${pointGet}已经过期`,
        metadata: {
          expiredAt: new Date(oneYearAgo),
          originalScore: score,
          expiredAmount: pointGet,
        },
        createdAt: new Date(),
      }
      arr.push(this.pointsRecordModel.create(pointsRecord))

      // 更新用户积分余额
      arr.push(this.userModel.findByIdAndUpdate(userId, { $set: { score: newBalance } }))

      await Promise.all(arr)
      this.logger.log(`Point expiration processed for user ${userId}, expired: ${pointGet}, new balance: ${newBalance}`)
    }
    catch (error) {
      this.logger.error(`Error processing point expiration for user ${userId}`, error)
      throw error
    }
  }

  async getPoint10DayExp(user: User) {
    const { id: userId } = user
    try {
      // 获取10天后即将过期的积分（一年前获取的积分）
      const oneYearAgo = dayjs().startOf('day').subtract(1, 'y').valueOf()
      const createdAt = {
        $gte: dayjs(oneYearAgo).subtract(10, 'd').valueOf(),
        $lt: oneYearAgo,
      }

      // 查询完全未抵扣的积分记录
      const $match = { userId, createdAt, status: IPointStatus.FREE, amount: { $gt: 0 } }
      const $group = { _id: null, pointGet: { $sum: '$amount' } }
      const data = await this.pointsRecordModel.aggregate([
        { $match },
        { $group },
      ])

      // 修复：正确获取pointGet值
      let pointGet = 0
      if (!_.isEmpty(data) && data[0] && _.has(data[0], 'pointGet')) {
        pointGet = data[0].pointGet
      }

      // 查询部分抵扣的积分记录
      const condition = { userId, createdAt, status: IPointStatus.PART_DI_KOU, amount: { $gt: 0 } }
      const PartDiKou: any = await this.pointsRecordModel.findOne(condition, 'id amount usedForDiKou status createdAt')

      if (!_.isEmpty(PartDiKou)) {
        const { amount, usedForDiKou } = PartDiKou
        const remainingAmount = amount - (usedForDiKou || 0)
        if (remainingAmount > 0) {
          pointGet += remainingAmount
        }
      }

      // 更新用户的10天后过期积分字段
      await this.userModel.findByIdAndUpdate(userId, { $set: { tenDayExpPoint: pointGet } })

      this.logger.debug(`Updated 10-day expiration points for user ${userId}: ${pointGet}`)
    }
    catch (error) {
      this.logger.error(`Error updating 10-day expiration points for user ${userId}`, error)
      throw error
    }
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
