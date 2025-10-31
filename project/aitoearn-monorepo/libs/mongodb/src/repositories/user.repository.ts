import * as crypto from 'node:crypto'
import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { UserStatus } from '../enums'
import { User } from '../schemas'
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
    @InjectModel(User.name)
    userModel: Model<User>,
  ) {
    super(userModel)
  }

  async getUserInfoById(id: string) {
    let userInfo
    try {
      const db = this.model.findById(id)
      db.select('+password +salt')
      userInfo = await db.exec()
    }
    catch {
      return null
    }
    return userInfo
  }

  async getUserInfoByMail(mail: string, all = false): Promise<User | null> {
    const db = this.model.findOne({
      mail,
      isDelete: false,
    })
    if (all)
      db.select('+password +salt')
    const userInfo = await db.exec()

    return userInfo
  }

  async getUserByPopularizeCode(popularizeCode: string): Promise<User | null> {
    const userInfo = await this.model.findOne({
      popularizeCode,
      status: UserStatus.OPEN,
      isDelete: false,
    })
    return userInfo
  }

  async updateUserInfo(id: string, newData: Partial<User>): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: id },
      { $set: { ...newData } },
    )
    return res.modifiedCount > 0
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: id },
      { $set: { status } },
    )
    return res.modifiedCount > 0
  }

  async deleteUser(id: string): Promise<boolean> {
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
  async generateUsePopularizeCode(userInfo: User) {
    const phoneHash = crypto
      .createHash('sha256')
      .update(userInfo.mail)
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
  getCursor(condition: FilterQuery<User>, tag: string) {
    return this.model
      .find(condition, tag)
      .cursor()
  }

  async setTotalStorage(userId: string, totalStorage: number, expiredAt?: Date): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      {
        $set: {
          storage: {
            total: totalStorage,
            expiredAt,
          },
        },
      },
    )
    return res.modifiedCount > 0
  }
}
