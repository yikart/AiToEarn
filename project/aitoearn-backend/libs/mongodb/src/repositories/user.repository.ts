import * as crypto from 'node:crypto'
import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { UserStatus, UserType } from '../enums'
import { User, UserAiInfo } from '../schemas'
import { BaseRepository, LeanDoc } from './base.repository'

export interface ListUserParams extends Pagination {
  status?: UserStatus
  mail?: string
  popularizeCode?: string
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

  async getByPopularizeCode(popularizeCode: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      popularizeCode,
      status: UserStatus.OPEN,
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
   * 生成推广码
   * @param userInfo
   * @returns
   */
  async updatePopularizeCodeById(userInfo: User) {
    const identifier = userInfo.mail || userInfo.phone || userInfo.id
    const phoneHash = crypto
      .createHash('sha256')
      .update(identifier)
      .digest('hex')
      .substring(0, 16)

    const combinedSalt = `aitoearn${phoneHash}`

    const hash = crypto
      .createHash('sha256')
      .update(userInfo.id)
      .update(combinedSalt)
      .digest('hex')

    // 取部分哈希值转换为5位代码
    const numericValue = Number.parseInt(hash.substring(0, 6), 16)
    const code = numericValue
      .toString(36)
      .slice(-5)
      .toUpperCase()
      .padStart(5, '0')

    // 更新用户的推广码
    await this.model.updateOne(
      { _id: userInfo.id },
      { $set: { popularizeCode: code } },
    )

    return code
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

  async updateUserTypeById(userId: string, userType: UserType): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { userType } },
    )
    return res.modifiedCount > 0
  }
}
