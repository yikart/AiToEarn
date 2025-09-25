import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { User, UserRepository, UserVipCycleType } from '@yikart/mongodb'
import dayjs from 'dayjs'
import { PointsService } from '../points/points.service'

const vipPointAddPointMap = new Map<UserVipCycleType, number>([
  [UserVipCycleType.EXPERIENCE, 100],
  [UserVipCycleType.MONTH, 700],
  [UserVipCycleType.YEAR, 700],
  [UserVipCycleType.NONE, 0],
])
@Injectable()
export class VipService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly pointsService: PointsService,
  ) {}

  private vipAddExpireTime(userVipCycleType: UserVipCycleType): {
    num: number
    type: 'day' | 'month' | 'year'
  } {
    switch (userVipCycleType) {
      case UserVipCycleType.EXPERIENCE:
        return {
          num: 7,
          type: 'day',
        }
      case UserVipCycleType.MONTH:
        return {
          num: 1,
          type: 'month',
        }
      case UserVipCycleType.YEAR:
        return {
          num: 12,
          type: 'month',
        }
      default:
        return {
          num: 0,
          type: 'day',
        }
    }
  }

  /**
   * 设置会员信息
   * @param userId
   * @param userVipCycleType
   */
  async setVipInfo(
    userId: string,
    userVipCycleType: UserVipCycleType,
  ): Promise<boolean> {
    // 1. 查询会员信息
    const user = await this.userRepository.getById(userId)
    if (!user)
      throw new AppException(ResponseCode.UserNotFound)

    const addInfo = this.vipAddExpireTime(userVipCycleType)

    // 根据充值的时间类型决定过期时间
    const expireTime = dayjs().add(
      addInfo.num,
      addInfo.type as dayjs.ManipulateType,
    )

    // 2. 没有会员信息或者已经过期，设置会员信息
    if (!user.vipInfo || user.vipInfo.expireTime < new Date()) {
      user.vipInfo = {
        cycleType: userVipCycleType,
        expireTime: expireTime.toDate(),
        autoContinue: true,
      }
    }
    else {
      // 3. 续费会员
      user.vipInfo.cycleType = userVipCycleType
      // 从用户会员信息的续费时间开始计算
      const tartTime = user.vipInfo.expireTime
      user.vipInfo.expireTime = dayjs(tartTime)
        .add(
          addInfo.num,
          addInfo.type,
        )
        .toDate()
    }

    user.vipInfo.autoContinue = true

    const res = await this.userRepository.updateById(user._id.toString(), {
      vipInfo: user.vipInfo,
    })

    // 充值积分
    this.addVipPoints(user)

    return res !== null
  }

  // 关闭自动付费
  async closeVipAutoContinue(userId: string): Promise<boolean> {
    const res = await this.userRepository.updateById(userId, {
      $set: { 'vipInfo.autoContinue': false },
    })
    return res !== null
  }

  /**
   * 增加会员积分
   * @param user
   * @returns
   */
  async addVipPoints(user: User): Promise<-1 | 0 | 1> {
    const list = await this.pointsService.findVipOpintsAddRepordOfMonth(user.id)
    if (list.length > 0) {
      return 0
    }

    const vipInfo = user.vipInfo
    if (!vipInfo)
      return -1

    const pointAmount = vipPointAddPointMap.get(vipInfo.cycleType)
    if (!pointAmount)
      return -1

    await this.pointsService.addPoints({
      userId: user.id,
      amount: pointAmount,
      type: 'vip_points',
      description: 'VIP receive points every month',
    },
    )
    return 1
  }

  /**
   * 查询当前有效的VIP会员列表
   * @returns
   */
  async findAllNormelVipUsers(): Promise<User[]> {
    const now = dayjs().toDate()
    return this.userRepository.listVipUsers(now)
  }
}
