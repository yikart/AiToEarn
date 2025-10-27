import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { UserStatus } from '../../enums'
import { User } from '../../schemas'
import { BaseRepository } from '../base.repository'

@Injectable()
export class AdminUserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel)
  }

  async getUserInfoById(id: string, all = false) {
    let userInfo
    try {
      const db = this.userModel.findById(id)
      if (all)
        db.select('+password +salt')
      userInfo = await db.exec()
    }
    catch {
      return null
    }
    return userInfo
  }

  async list(pageInfo: {
    pageSize: number
    pageNo: number
  }, query: {
    keyword?: string
    status?: UserStatus
    time?: string[]
  }) {
    const { pageSize, pageNo } = pageInfo
    const { keyword, status } = query
    const filter: RootFilterQuery<User> = {
      ...(status !== undefined && { status }),
      ...(keyword !== undefined && {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { mail: { $regex: keyword, $options: 'i' } },
        ],
      }),
      ...(query.time && {
        createdAt: {
          $gte: query.time[0],
          $lte: query.time[1],
        },
      }),
    }

    const list = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(pageNo! > 0 ? (pageNo! - 1) * pageSize : 0)
      .limit(pageSize)
      .exec()

    return {
      list,
      total: await this.userModel.countDocuments(filter),
    }
  }
}
