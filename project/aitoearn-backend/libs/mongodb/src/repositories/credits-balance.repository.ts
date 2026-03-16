import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreditsBalance } from '../schemas'
import { BaseRepository } from './base.repository'

export class CreditsBalanceRepository extends BaseRepository<CreditsBalance> {
  logger = new Logger(CreditsBalanceRepository.name)
  constructor(
    @InjectModel(CreditsBalance.name) private readonly creditsBalanceModel: Model<CreditsBalance>,
  ) {
    super(creditsBalanceModel)
  }

  /**
   * 获取或创建用户余额记录
   */
  async getOrCreate(userId: string): Promise<CreditsBalance> {
    let balance = await this.creditsBalanceModel.findOne({ userId }).lean({ virtuals: true }).exec()
    if (!balance) {
      balance = await this.creditsBalanceModel.create({
        userId,
        balance: 0,
      })
    }
    return balance
  }

  /**
   * 增加余额
   */
  async increment(userId: string, amount: number): Promise<void> {
    await this.creditsBalanceModel.updateOne(
      { userId },
      { $inc: { balance: amount } },
      { upsert: true },
    )
  }

  /**
   * 减少余额
   */
  async decrement(userId: string, amount: number): Promise<void> {
    await this.creditsBalanceModel.updateOne(
      { userId },
      { $inc: { balance: -amount } },
    )
  }

  /**
   * 获取用户余额
   */
  async getBalance(userId: string): Promise<number> {
    const balance = await this.creditsBalanceModel.findOne({ userId }).lean({ virtuals: true }).exec()
    return balance?.balance || 0
  }

  /**
   * 设置用户余额为指定值
   */
  async updateBalanceByUserId(userId: string, balance: number): Promise<void> {
    await this.creditsBalanceModel.updateOne(
      { userId },
      { $set: { balance } },
      { upsert: true },
    )
  }

  async updateAllBalance(balance: number): Promise<number> {
    const res = await this.creditsBalanceModel.updateMany(
      {},
      { $set: { balance } },
    )
    return res.modifiedCount
  }
}
