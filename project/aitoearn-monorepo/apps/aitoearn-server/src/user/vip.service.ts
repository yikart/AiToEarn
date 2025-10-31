import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { User, UserRepository, UserVipInfo, VipRepository, VipStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import dayjs from 'dayjs'
import { PointsService } from './points.service'

const vipPointAddPointMap = new Map<VipStatus, number>([
  [VipStatus.active_monthly, 700],
  [VipStatus.active_nonrenewing, 700],
  [VipStatus.active_yearly, 700],
  [VipStatus.monthly_once, 700],
  [VipStatus.yearly_once, 700],
  [VipStatus.trialing, 100],
])

export const VipAddExpireTimeMap = new Map<VipStatus, { num: number, type: 'day' | 'month' | 'year' }>([
  [VipStatus.monthly_once, {
    num: 1,
    type: 'month',
  }],
  [VipStatus.yearly_once, {
    num: 12,
    type: 'month',
  }],
  [VipStatus.active_monthly, {
    num: 1,
    type: 'month',
  }],
  [VipStatus.active_yearly, {
    num: 12,
    type: 'month',
  }],
  [VipStatus.trialing, {
    num: 7,
    type: 'day',
  }],

])
@Injectable()
export class VipService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly vipRepository: VipRepository,
    private readonly pointsService: PointsService,
    private readonly redisService: RedisService,
  ) { }

  /**
   * 设置会员信息
   * @param userId
   * @param vipStatus
   */
  async setVipInfo(
    userId: string,
    vipStatus: VipStatus,
  ): Promise<boolean> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound, 'User Not Found')
    }
    let vipInfo = await this.getVipInfo(user)

    // 限制体验会员只能有一次
    if (vipInfo && vipStatus === VipStatus.trialing) {
      return false
    }

    // 根据充值的时间类型决定过期时间
    const addInfo = VipAddExpireTimeMap.get(vipStatus) || { num: 0, type: 'day' }
    const expireTime = dayjs().add(addInfo.num, addInfo.type)

    // 没有会员信息或者已经过期，设置会员信息
    if (
      !vipInfo || vipInfo.expireTime <= new Date()
    ) {
      vipInfo = {
        expireTime: expireTime.toDate(),
        status: vipStatus,
        startTime: new Date(),
      }
    }
    else {
      vipInfo = {
        expireTime: dayjs(vipInfo.expireTime).add(addInfo.num, addInfo.type).toDate(),
        status: vipStatus,
        startTime: vipInfo.startTime,
      }
    }

    const res = await this.vipRepository.updateInfo(user, vipInfo)
    this.redisService.del(`UserInfo:${user.id}`)

    // 充值积分
    this.addNewVipPoints(user)
    return res
  }

  /**
   * 增加新会员的积分
   * @param user
   * @returns
   */
  async addNewVipPoints(user: User): Promise<-1 | 0 | 1> {
    if (!user.vipInfo || !user.vipInfo.status) {
      return -1
    }

    if ([VipStatus.expired, VipStatus.none].includes(user.vipInfo.status)) {
      return -1
    }

    const pointAmount = vipPointAddPointMap.get(user.vipInfo.status)
    if (!pointAmount)
      return -1

    await this.pointsService.addPoints({
      userId: user.id,
      amount: pointAmount,
      type: 'vip_points',
      description: 'VIP receive points every month',
    })
    return 1
  }

  /**
   * 增加会员积分
   * @param user
   * @returns
   */
  async addVipPoints(user: User): Promise<-1 | 0 | 1> {
    if (!user.vipInfo) {
      return -1
    }

    // 查找当前是否已经有发放记录
    const list = await this.pointsService.findVipOpintsAddRepordOfMonth(
      user.id,
    )
    if (list.length > 0) {
      return 0
    }

    const pointAmount = vipPointAddPointMap.get(user.vipInfo.status)
    if (!pointAmount)
      return -1

    await this.pointsService.addPoints({
      userId: user.id,
      amount: pointAmount,
      type: 'vip_points',
      description: 'VIP receive points every month',
    })
    return 1
  }

  async updateVipStatus(userId: string, status: VipStatus): Promise<boolean> {
    const res = await this.vipRepository.updateVipStatus(userId, status)
    this.redisService.del(`UserInfo:${userId}`)
    return res
  }

  async clearVipInfo(userId: string): Promise<boolean> {
    const res = await this.vipRepository.clearVipInfo(userId)
    return res
  }

  private getNewStatus(vipInfo: UserVipInfo) {
    const { expireTime, status } = vipInfo
    if (
      expireTime <= new Date()
    ) {
      return VipStatus.expired
    }

    if (
      !status
    ) {
      return VipStatus.none
    }

    return status
  }

  async getVipInfo(user: User): Promise<UserVipInfo | null> {
    const vipInfo = user.vipInfo
    if (!vipInfo || !vipInfo.expireTime) {
      return null
    }
    const newStatus = this.getNewStatus(vipInfo)

    if (vipInfo.status !== newStatus) {
      this.vipRepository.updateVipStatus(user.id, newStatus)
      this.redisService.del(`UserInfo:${user.id}`)
    }

    vipInfo.status = newStatus
    return vipInfo
  }

  /**
   * 查询当前有效的VIP会员列表
   * @returns
   */
  async findAllNormelVipUsers(): Promise<User[]> {
    return this.vipRepository.findAllNormelVipUsers()
  }
}
