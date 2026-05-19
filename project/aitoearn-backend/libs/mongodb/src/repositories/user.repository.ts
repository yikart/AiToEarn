import { InjectModel } from '@nestjs/mongoose'
import { Pagination, VipStatus } from '@yikart/common'
import { FilterQuery, Model, RootFilterQuery } from 'mongoose'
import { UserStatus } from '../enums'
import { User, UserAiInfo, UserVipInfo } from '../schemas'
import { BaseRepository, LeanDoc } from './base.repository'

export interface ListUserParams extends Pagination {
  status?: UserStatus
  mail?: string
  createdAt?: string[]
  keyword?: string
}

export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    userModel: Model<User>,
  ) {
    super(userModel)
  }

  override async getById(id: string): Promise<LeanDoc<User> | null> {
    let userInfo
    try {
      const db = this.model.findById(id)
      db.select('+password +salt')
      userInfo = await db.lean({ virtuals: true }).exec()
    }
    catch {
      return null
    }
    return userInfo as LeanDoc<User> | null
  }

  async listByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return []
    }
    return this.model.find({
      _id: { $in: ids },
    }).lean({ virtuals: true }).exec()
  }

  async getByMail(mail: string, all = false): Promise<User | null> {
    const db = this.model.findOne({
      mail,
      isDelete: false,
    })
    if (all)
      db.select('+password +salt')
    const userInfo = await db.lean({ virtuals: true }).exec()

    return userInfo
  }

  async getByMailForRegister(mail: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      mail,
      isDelete: false,
    }).lean({ virtuals: true })
    return userInfo
  }

  async getByPhone(phone: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      phone,
      isDelete: false,
    })
    return userInfo
  }

  async getByDouyinUnionid(douyinUnionid: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      douyinUnionid,
      isDelete: false,
    }).lean({ virtuals: true })
    return userInfo
  }

  async getByDouyinMiniAppOpenid(douyinMiniAppOpenid: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      douyinMiniAppOpenid,
      isDelete: false,
    }).lean({ virtuals: true })
    return userInfo
  }

  async clearDouyinMiniAppIdentity(identity: { douyinMiniAppOpenid?: string, douyinUnionid?: string }): Promise<void> {
    const filters: RootFilterQuery<User>[] = []
    if (identity.douyinUnionid) {
      filters.push({ douyinUnionid: identity.douyinUnionid })
    }
    if (identity.douyinMiniAppOpenid) {
      filters.push({ douyinMiniAppOpenid: identity.douyinMiniAppOpenid })
    }

    if (filters.length === 0) {
      return
    }

    await this.model.updateMany(
      { $or: filters },
      { $unset: { douyinUnionid: '', douyinMiniAppOpenid: '' } },
    ).exec()
  }

  async clearDouyinUnionidByUserId(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $unset: { douyinUnionid: '', douyinMiniAppOpenid: '' } },
    ).exec()
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: id },
      { $set: { status } },
    )
    return res.modifiedCount > 0
  }

  async softDeleteById(id: string): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: id },
      { $set: { isDelete: true } },
    )
    return res.modifiedCount > 0
  }

  /**
   * 获取游标
   * @param condition
   * @param tag
   * @returns
   */
  getCursor(condition: FilterQuery<User>, tag?: string) {
    return this.model
      .find(condition, tag)
      .lean({ virtuals: true })
      .cursor()
  }

  async updateAiConfigById(userId: string, aiConfig: Partial<UserAiInfo>): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { aiInfo: aiConfig } },
    )
    return res.modifiedCount > 0
  }

  async updateAiConfigItemById(userId: string, type: 'image' | 'edit' | 'video' | 'agent', value: {
    defaultModel: string
    option?: Record<string, any>
  }): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { [`aiInfo.${type}`]: { defaultModel: value.defaultModel, option: value.option } } },
    )
    return res.modifiedCount > 0
  }

  async list(filter: FilterQuery<User> = {}): Promise<User[]> {
    return this.model.find(filter).lean({ virtuals: true }).exec()
  }

  /**
   * 分页获取用户列表
   */
  async listWithPagination(params: { page: number, pageSize: number }) {
    return this.findWithPagination({
      ...params,
      filter: {
        isDelete: false,
        status: UserStatus.OPEN,
      },
    })
  }

  async listByPlaceId(placeId: string): Promise<User[]> {
    return this.model.find({ placeId, isDelete: false }).lean({ virtuals: true }).exec()
  }

  async updateLibraryIdById(userId: string, libraryId: string | null): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { libraryId } },
    )
    return res.modifiedCount > 0
  }

  async listAllActiveIds(): Promise<string[]> {
    const users = await this.model
      .find({ isDelete: false, status: UserStatus.OPEN })
      .select('_id')
      .lean()
      .exec()
    return users.map(u => u._id.toString())
  }

  async listByLibraryId(libraryId: string): Promise<User[]> {
    return this.model.find({ libraryId, isDelete: false }).lean({ virtuals: true }).exec()
  }

  async listAllWithPagination(
    pageInfo: { pageSize: number, pageNo: number },
    query: { keyword?: string, status?: UserStatus, time?: string[] },
  ): Promise<readonly [LeanDoc<User>[], number]> {
    const { pageSize, pageNo } = pageInfo
    const { keyword, status } = query
    const escapedKeyword = keyword ? this.escapeRegExp(keyword) : undefined
    const filter: RootFilterQuery<User> = {
      ...(status !== undefined && { status }),
      ...(escapedKeyword !== undefined && {
        $or: [
          { name: { $regex: escapedKeyword, $options: 'i' } },
          { mail: { $regex: escapedKeyword, $options: 'i' } },
          { phone: { $regex: escapedKeyword, $options: 'i' } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: '$_id' },
                regex: escapedKeyword,
                options: 'i',
              },
            },
          },
        ],
      }),
      ...(query.time && {
        createdAt: {
          $gte: query.time[0],
          $lte: query.time[1],
        },
      }),
    }
    return this.findWithPagination({
      page: pageNo,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  async listAllEmails(): Promise<string[]> {
    const users = await this.model
      .find({ mail: { $exists: true, $ne: '' } })
      .select('mail')
      .lean({ virtuals: true })
      .exec()
    return users.map(u => u.mail)
  }

  async getNewUserTotal(startDate: Date, endDate: Date): Promise<number> {
    return this.model.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    })
  }

  async getNewUserTrend(startDate: Date, endDate: Date): Promise<{ date: Date, count: number }[]> {
    return this.model.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: { $dateFromString: { dateString: '$_id' } }, count: 1 } },
    ])
  }

  async listIdsByCreatedAtRange(startDate: Date, endDate: Date): Promise<string[]> {
    const users = await this.model.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).select('_id').lean().exec()

    return users.map(user => user._id.toString())
  }

  async updateVipInfoById(userId: string, vipInfo: UserVipInfo): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { vipInfo } },
    )
    return res.modifiedCount > 0
  }

  async updateVipStatus(userId: string, status: VipStatus): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { 'vipInfo.status': status } },
    )
    return res.modifiedCount > 0
  }

  async clearVipInfo(userId: string): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { vipInfo: null } },
    )
    return res.modifiedCount > 0
  }

  async clearAllVipInfo(): Promise<number> {
    const res = await this.model.updateMany(
      { vipInfo: { $ne: null } },
      { $set: { vipInfo: null } },
    )
    return res.modifiedCount
  }

  async listNormalVipUsers(): Promise<LeanDoc<User>[]> {
    const now = new Date()
    return this.model.find({
      'vipInfo.expireAt': { $gt: now },
    }).lean({ virtuals: true })
  }
}
