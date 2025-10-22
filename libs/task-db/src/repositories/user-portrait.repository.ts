import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { UserPortrait } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class UserPortraitRepository extends BaseRepository<UserPortrait> {
  constructor(
    @InjectModel(UserPortrait.name)
    private portraitModel: Model<UserPortrait>,
  ) {
    super(portraitModel)
  }

  async findOneAndUpdate(userId: string, data: Partial<UserPortrait>) {
    const res = await this.portraitModel.findOneAndUpdate(
      { userId },
      {
        ...data,
        lastUpdatedAt: new Date(),
      },
      { upsert: true, new: true },
    )
    return res
  }

  async getUserPortrait(userId: string): Promise<UserPortrait | null> {
    return await this.portraitModel.findOne({ userId }).exec()
  }

  async listUserPortraits(page: {
    pageNo: number
    pageSize: number
  }, filter: {
    keyword?: string
    time?: [Date, Date]
  }): Promise<{ list: UserPortrait[], total: number }> {
    const mongoFilter: RootFilterQuery<UserPortrait> = {
      ...(filter.keyword && { $or: [{ name: { $like: filter.keyword } }, { mail: { $like: filter.keyword } }] }),
      ...(filter.time && { lastLoginTime: { $gte: filter.time[0], $lte: filter.time[1] } }),
    }

    const { pageNo, pageSize } = page

    const [list, total] = await Promise.all([
      this.portraitModel
        .find(mongoFilter)
        .sort({ totalFollowers: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.portraitModel.countDocuments(mongoFilter),
    ])

    return { list, total }
  }

  async updateTotalViolations(payload: {
    userId: string
    count: number
  }) {
    await this.portraitModel.updateOne(
      { userId: payload.userId },
      { $inc: { totalViolations: payload.count } },
    )
  }
}
