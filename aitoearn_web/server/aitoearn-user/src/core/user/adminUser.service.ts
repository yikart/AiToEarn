import { User, UserStatus, UserWallet } from '@libs/database/schema'
import { RedisService } from '@libs/redis'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TableDto } from '@/common/global/dto/table.dto'

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name)

  constructor(
    private readonly redisService: RedisService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(UserWallet.name)
    private readonly userWalletModel: Model<UserWallet>,
  ) {
  }

  async getUserInfoById(id: string, all = false) {
    const key = `UserInfo:${id}`
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
    void this.redisService.setKey(key, userInfo)
    return userInfo
  }

  async list(pageInfo: TableDto, query: {
    keyword?: string
    status?: UserStatus
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
    }

    const list = await this.userModel
      .find(filter)
      .skip(pageNo! > 0 ? (pageNo! - 1) * pageSize : 0)
      .limit(pageSize)
      .exec()

    return {
      list,
      total: await this.userModel.countDocuments(filter),
    }
  }
}
