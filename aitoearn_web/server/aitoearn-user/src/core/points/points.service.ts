import { User } from '@libs/database/schema'
import { PointsRecord } from '@libs/database/schema/points-record.schema'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AppException } from '@/common'
import { ExceptionCode } from '@/common/enums/exception-code.enum'
import { AddPointsDto, DeductPointsDto } from './points.dto'

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name)

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(PointsRecord.name)
    private readonly pointsRecordModel: Model<PointsRecord>,
  ) {}

  /**
   * 获取用户积分余额
   * @param userId 用户ID
   * @returns 用户积分余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec()
    if (!user) {
      throw new AppException(ExceptionCode.UserNotFound)
    }
    return user.score || 0
  }

  /**
   * 获取积分记录列表
   * @param userId 用户ID
   * @param limit 每页数量
   * @param offset 偏移量
   * @returns 积分记录列表
   */
  async getRecords(userId: string, page = 1, pageSize = 10) {
    return await Promise.all([
      this.pointsRecordModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.pointsRecordModel.countDocuments({ userId }).exec(),
    ])
  }

  /**
   * 增加积分
   * @param data 添加积分的数据
   */
  async addPoints(data: AddPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data

    await this.userModel.db.transaction(async () => {
      const user = await this.userModel.findById(userId).exec()
      if (!user) {
        throw new AppException(ExceptionCode.UserNotFound)
      }

      await this.userModel.updateOne(
        { _id: userId },
        { $inc: { score: amount } },
      )

      await this.pointsRecordModel.create([{
        userId,
        amount,
        balance: user.score + amount,
        type,
        description,
        metadata,
      }])
    })
  }

  /**
   * 扣减积分
   * @param data 扣减积分的数据
   */
  async deductPoints(data: DeductPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data

    await this.userModel.db.transaction(async () => {
      const user = await this.userModel.findById(userId).exec()
      if (!user) {
        throw new AppException(ExceptionCode.UserNotFound)
      }

      const currentBalance = user.score || 0
      const newBalance = currentBalance - amount

      await this.userModel.updateOne(
        { _id: userId },
        { $set: { points: newBalance } },
      )

      await this.pointsRecordModel.create([{
        userId,
        amount: -amount,
        balance: newBalance,
        type,
        description,
        metadata,
        createdAt: new Date(),
      }])
    })
  }
}
