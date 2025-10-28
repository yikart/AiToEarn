import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { Decimal128 } from 'mongodb'
import { FilterQuery, Model } from 'mongoose'
import { UserWallet } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListUserWalletParams extends Pagination {
  userId?: string
}

export class UserWalletRepository extends BaseRepository<UserWallet> {
  constructor(
    @InjectModel(UserWallet.name) private readonly userWalletModel: Model<UserWallet>,
  ) {
    super(userWalletModel)
  }

  async listWithPagination(params: ListUserWalletParams) {
    const { page, pageSize, userId } = params

    const filter: FilterQuery<UserWallet> = {}
    if (userId)
      filter.userId = userId

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async getByUserId(userId: string): Promise<UserWallet | null> {
    return await this.findOne({ userId })
  }

  async updateBalanceByUserId(userId: string, balance: Decimal128): Promise<UserWallet | null> {
    return await this.updateOne({ userId }, { balance })
  }

  async updateIncomeByUserId(userId: string, income: Decimal128): Promise<UserWallet | null> {
    return await this.updateOne({ userId }, { income })
  }

  async incrementBalanceByUserId(userId: string, amount: Decimal128): Promise<UserWallet | null> {
    return await this.model.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true },
    ).exec()
  }

  async incrementIncomeByUserId(userId: string, amount: Decimal128): Promise<UserWallet | null> {
    return await this.model.findOneAndUpdate(
      { userId },
      { $inc: { income: amount } },
      { new: true, upsert: true },
    ).exec()
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteOne({ userId })
  }
}
