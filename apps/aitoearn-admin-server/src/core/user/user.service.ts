import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { AdminUserRepository, PointsRecordRepository, User, UserStatus, VipRepository, VipStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import axios from 'axios'
import { getCurrentTimestamp, getRandomString } from '../../common'
import { config } from '../../config'
import { PortraitApi } from '../../transports/task/portrait.api'
import { VipApi } from '../../transports/user/vip.natsApi'

const VipAddPointsLockKey = 'vip:add:points:lock:'
const vipPointAddPointMap = new Map<VipStatus, number>([
  [VipStatus.active_monthly, 700],
  [VipStatus.active_nonrenewing, 700],
  [VipStatus.active_yearly, 700],
  [VipStatus.monthly_once, 700],
  [VipStatus.yearly_once, 700],
  [VipStatus.trialing, 100],
])

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: AdminUserRepository,
    private readonly vipRepository: VipRepository,
    private readonly pointsRecordRepository: PointsRecordRepository,
    private readonly portraitApi: PortraitApi,
    private readonly vipApi: VipApi,
    private readonly redisService: RedisService,

  ) { }

  async getUserInfo(userId: string) {
    return this.userRepository.getById(userId)
  }

  async list(page: TableDto, query: {
    keyword?: string
    status?: UserStatus
    time?: string[]
  }) {
    return this.userRepository.list(page, query)
  }

  // 进行全部会员积分发放
  async doVipAddAllPoints() {
    const theKeyHad = await this.redisService.get(VipAddPointsLockKey)

    if (theKeyHad)
      return

    this.redisService.set(VipAddPointsLockKey, '1', 60 * 60 * 24)
    const userList = await this.vipRepository.findAllNormelVipUsers()

    userList.forEach(async (user: User) => {
      this.addVipPoints(user)
    })
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
    const list = await this.pointsRecordRepository.findVipOpintsAddRepordOfMonth(
      user.id,
    )
    if (list.length > 0) {
      return 0
    }

    const pointAmount = vipPointAddPointMap.get(user.vipInfo.status)
    if (!pointAmount)
      return -1

    await this.pointsRecordRepository.addPoints(user, {
      amount: pointAmount,
      type: 'vip_points',
      description: 'VIP receive points every month',
    })
    return 1
  }

  // 设置会员
  async setVip(data: {
    userId: string
    status: VipStatus
  }) {
    return this.vipApi.setVipInfo(data)
  }

  async clearVipInfo(userId: string) {
    return this.vipRepository.clearVipInfo(userId)
  }

  async getUserToken(userId: string) {
    const code = getRandomString(8)
    const createAt = getCurrentTimestamp()
    const res = await this.redisService.setJson(`managerGetUserToken:${userId}`, { code, createAt })
    if (!res)
      throw new AppException(1000, '获取失败')

    // 发起axios请求
    const urlPath = `${config.userServer.host}/api/manager/getUserToken`
    const res2 = await axios.post<{ code: number, data: string, message: string }>(urlPath, {
      userId,
      code,
    })

    if (res2.data.code)
      throw new AppException(1000, res2.data.message)
    return res2.data.data
  }

  async upPortrait(userId: string) {
    const user = await this.userRepository.getById(userId)
    return this.portraitApi.userPortraitReport(user)
  }
}
