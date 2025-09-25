import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { User, UserStatus } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListUserParams extends Pagination {
  status?: UserStatus
  mail?: string
  popularizeCode?: string
  createdAt?: string[]
  keyword?: string
}

export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name) userModel: Model<User>,
  ) {
    super(userModel)
  }

  async listWithPagination(params: ListUserParams) {
    const { page, pageSize, status, mail, createdAt, keyword, popularizeCode } = params

    const filter: FilterQuery<User> = {}
    if (status)
      filter.status = status
    if (mail)
      filter.mail = mail
    if (popularizeCode)
      filter.popularizeCode = popularizeCode
    if (createdAt) {
      filter.createdAt = {
        $gte: createdAt[0],
        $lte: createdAt[1],
      }
    }
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { mail: { $regex: keyword, $options: 'i' } },
      ]
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }

  async getUserByMail(mail: string) {
    return await this.findOne({ mail, status: UserStatus.OPEN, isDelete: false })
  }

  async getUserByPopularizeCode(popularizeCode: string) {
    return await this.findOne({ popularizeCode, status: UserStatus.OPEN })
  }

  async listVipUsers(expireTime: Date) {
    return await this.find({
      'vipInfo.expireTime': { $gt: expireTime },
    })
  }

  async getByIdWithPassword(id: string): Promise<User | null> {
    return await this.model.findById(id).select('+password +salt').exec()
  }

  async getUserByMailWithPassword(mail: string): Promise<User | null> {
    return await this.model.findOne({ mail, status: UserStatus.OPEN }).select('+password +salt').exec()
  }
}
