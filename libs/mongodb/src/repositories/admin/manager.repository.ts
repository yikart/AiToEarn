import { Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Manager } from '../../schemas'
import { BaseRepository } from '../base.repository'

export class ManagerRepository extends BaseRepository<Manager> {
  logger = new Logger(ManagerRepository.name)
  constructor(
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
  ) { super(managerModel) }

  async getInfoById(id: string, all = false) {
    let userInfo
    if (userInfo)
      return userInfo
    try {
      const db = this.managerModel.findById(id)
      if (all)
        db.select('+password +salt')
      userInfo = await db.exec()
    }
    catch (error) {
      this.logger.error(error)
      return null
    }
    return userInfo
  }

  /**
   * 创建管理员
   * @param data
   * @returns
   */
  async createByAccount(data: Partial<Manager>): Promise<Manager> {
    const res = await this.managerModel.create(data)
    return res
  }

  async getInfoByAccount(account: string) {
    const info = await this.managerModel.findOne({
      account,
    })
    return info
  }

  /**
   * 更新用户密码
   * @param mail
   * @param password
   * @returns
   */
  async updateUserPassword(
    id: string,
    newData: {
      password: string
      salt: string
    },
  ): Promise<0 | 1> {
    const res = await this.managerModel.updateOne(
      { _id: id },
      {
        $set: {
          password: newData.password,
          salt: newData.salt,
        },
      },
    )

    return res.modifiedCount > 0 ? 1 : 0
  }
}
