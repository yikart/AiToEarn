import { InjectModel } from '@nestjs/mongoose'
import { VipStatus } from '@yikart/common'
import { Model } from 'mongoose'
import { User, UserVipInfo } from '../schemas'
import { BaseRepository } from './base.repository'

export class VipRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel)
  }

  async updateInfo(
    user: User,
    vipInfo: UserVipInfo,
  ): Promise<boolean> {
    const res = await this.userModel.updateOne(
      {
        _id: user.id,
      },
      {
        $set: {
          vipInfo,
        },
      },
    )

    return res.modifiedCount > 0
  }

  async updateVipStatus(userId: string, status: VipStatus): Promise<boolean> {
    const res = await this.userModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          'vipInfo.status': status,
        },
      },
    )
    return res.modifiedCount > 0
  }

  async clearVipInfo(userId: string): Promise<boolean> {
    const res = await this.userModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          vipInfo: null,
        },
      },
    )
    return res.modifiedCount > 0
  }

  /**
   * 查询当前有效的VIP会员列表
   * @returns
   */
  async findAllNormelVipUsers(): Promise<User[]> {
    const now = new Date()
    return this.userModel.find({
      'vipInfo.expireTime': { $gt: now },
    })
  }
}
