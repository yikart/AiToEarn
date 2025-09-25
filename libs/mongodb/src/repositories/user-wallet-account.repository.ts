import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
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

  async listWithPagination(params: ListUserWalletAccountParams) {
    const { page, pageSize, userId, type, isDef } = params

    const filter: FilterQuery<UserWalletAccount> = {}
    if (userId)
      filter.userId = userId
    if (type)
      filter.type = type
    if (isDef !== undefined)
      filter.isDef = isDef

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async listByUserId(userId: string, params: ListUserWalletAccountByUserIdParams): Promise<UserWalletAccount[]> {
    const { type, isDef } = params
    const filter: FilterQuery<UserWalletAccount> = {
      userId,
    }
    if (type)
      filter.type = type
    if (isDef !== undefined)
      filter.isDef = isDef

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async listByType(params: ListUserWalletAccountByTypeParams): Promise<UserWalletAccount[]> {
    const { type, isDef } = params
    const filter: FilterQuery<UserWalletAccount> = {
      type,
    }
    if (isDef !== undefined)
      filter.isDef = isDef

    return await this.find(filter, { sort: { createdAt: -1 } })
  }

  async getByUserIdAndType(userId: string, type: string): Promise<UserWalletAccount | null> {
    return await this.findOne({ userId, type })
  }

  async getByUserIdTypeAndAccount(userId: string, type: string, account: string): Promise<UserWalletAccount | null> {
    return await this.findOne({ userId, type, account })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.deleteMany({ userId })
  }

  async countByUserId(userId: string) {
    return await this.count({ userId })
  }
}
