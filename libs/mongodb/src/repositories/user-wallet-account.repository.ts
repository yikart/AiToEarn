import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { WalletAccountType } from '../enums'
import { UserWalletAccount } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListUserWalletAccountParams extends Pagination {
  userId?: string
  type?: string
  isDef?: boolean
}

export interface ListUserWalletAccountByUserIdParams {
  type?: string
  isDef?: boolean
}

export interface ListUserWalletAccountByTypeParams {
  type: string
  isDef?: boolean
}

export class UserWalletAccountRepository extends BaseRepository<UserWalletAccount> {
  constructor(
    @InjectModel(UserWalletAccount.name) private readonly userWalletAccountModel: Model<UserWalletAccount>,
  ) {
    super(userWalletAccountModel)
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.userWalletAccountModel.deleteOne({ _id: id }).exec()
    return res.deletedCount > 0
  }

  async update(id: string, update: Partial<UserWalletAccount>): Promise<boolean> {
    const res = await this.userWalletAccountModel.updateOne({ _id: id }, { $set: update }).exec()
    return res.modifiedCount === 1
  }

  async infoWithSame(userId: string, type: WalletAccountType, account: string) {
    return this.userWalletAccountModel.findOne({ userId, type, account }).exec()
  }

  async info(id: string) {
    return this.userWalletAccountModel.findOne({ _id: id }).exec()
  }

  async list(pageInfo: {
    pageNo: number
    pageSize: number
  }, query: {
    userId?: string
  }) {
    const { pageSize, pageNo } = pageInfo
    const { userId } = query
    const filter: RootFilterQuery<UserWalletAccount> = {
      ...(userId !== undefined && { userId }),
    }

    const [list, total] = await Promise.all([
      this.userWalletAccountModel
        .find(filter)
        .skip(pageNo! > 0 ? (pageNo! - 1) * pageSize : 0)
        .limit(pageSize)
        .exec(),
      this.userWalletAccountModel.countDocuments(filter),
    ])

    return {
      list,
      total,
    }
  }

  // 获取总数
  async countOfUser(userId: string) {
    const filter: RootFilterQuery<UserWalletAccount> = {
      userId,
    }
    return this.userWalletAccountModel.countDocuments(filter)
  }
}
