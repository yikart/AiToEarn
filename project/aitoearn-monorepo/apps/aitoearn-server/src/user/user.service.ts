import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AppException, ResponseCode } from '@yikart/common'
import { MaterialGroupRepository, MediaGroupRepository, User, UserRepository, UserStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import axios from 'axios'
import dayjs from 'dayjs'
import { google } from 'googleapis'
import { NewUser, UserCreateType } from './class/user.class'
import { UpdateUserInfoDto } from './dto/user.dto'
import { PointsService } from './points.service'
import { VipService } from './vip.service'

@Injectable()
export class UserService {
  logger = new Logger(UserService.name)
  private oauth2Client: any

  constructor(
    private readonly queueService: QueueService,
    private readonly userRepository: UserRepository,
    private readonly vipService: VipService,
    private readonly pointsService: PointsService,
    private readonly redisService: RedisService,
    private readonly materialGroupRepository: MaterialGroupRepository,
    private readonly mediaGroupRepository: MediaGroupRepository,
  ) {
    this.oauth2Client = new google.auth.OAuth2()
  }

  /**
   * 获取用户信息
   * @param mail
   * @param all
   * @returns
   */
  async getUserInfoByMail(mail: string, all = false) {
    const res = await this.userRepository.getUserInfoByMail(mail, all)
    if (!res)
      return null
    const vipInfo = await this.vipService.getVipInfo(res)
    res.vipInfo = vipInfo || undefined
    return res
  }

  /**
   * 获取用户信息
   * @param id
   * @returns
   */
  async getUserInfoById(id: string) {
    const res = await this.userRepository.getUserInfoById(id)
    void this.redisService.setJson(`UserInfo:${id}`, res)
    if (!res)
      throw new AppException(1000, 'User does not exist')

    const vipInfo = await this.vipService.getVipInfo(res)

    res.vipInfo = vipInfo || undefined
    return res
  }

  /**
   * 根据推广码获取用户信息
   * @param inviteCode
   * @returns
   */
  async getUserByPopularizeCode(inviteCode: string): Promise<User | null> {
    const res = await this.userRepository.getUserByPopularizeCode(inviteCode)
    return res
  }

  /**
   * 邮箱创建用户
   * @param mail
   * @param password
   * @param salt
   * @param inviteCode
   * @returns
   */
  async createUserByMail(
    mail: string,
    password: string,
    salt: string,
    inviteCode?: string,
  ): Promise<User> {
    const newData = new NewUser(UserCreateType.mail, mail, {
      password,
      salt,
    })
    newData.inviteCode = inviteCode

    const res = await this.userRepository.create(
      newData,
    )
    const userInfo = res.toJSON()
    this.afterCreate(userInfo)
    return userInfo
  }

  /**
   * 更新用户密码
   * @param id
   * @param password
   * @param salt
   * @returns
   */
  async updateUserPassword(id: string, password: string, salt: string): Promise<boolean> {
    const res = await this.userRepository.updateById(
      id,
      {
        $set: {
          password,
          salt,
        },
      },
    )

    this.redisService.del(`UserInfo:${id}`)
    return res !== null
  }

  /**
   * 更新用户信息
   * @param id
   * @param data
   * @returns
   */
  async updateUserInfo(
    id: string,
    newdData: UpdateUserInfoDto,
  ): Promise<boolean> {
    const res = await this.userRepository.updateUserInfo(id, newdData)
    return res
  }

  /**
   * 更新用户信息
   * @param id
   * @param data
   * @returns
   */
  async updateUserStatus(
    id: string,
    status: UserStatus,
  ): Promise<boolean> {
    const res = await this.userRepository.updateUserStatus(id, status)
    return res
  }

  /**
   * 更新用户信息
   * @param id
   * @param data
   * @returns
   */
  async delete(
    id: string,
  ): Promise<boolean> {
    const res = await this.userRepository.deleteUser(id)
    return res
  }

  /**
   * 生成用户推广码
   * @returns
   */
  async generateUsePopularizeCode(id: string) {
    const user = await this.getUserInfoById(id)
    if (!user)
      throw new AppException(ResponseCode.UserNotFound, 'User does not exist')
    const res = await this.userRepository.generateUsePopularizeCode(user)
    this.redisService.del(`UserInfo:${id}`)
    return res
  }

  /**
   * 邮箱创建谷歌用户
   * @param clientId
   * @param credential
   * @returns
   */
  async getUserInfoByGoogle(
    clientId: string,
    credential: string,
  ): Promise<User | null> {
    this.logger.debug('Verifying Google token')
    // 验证Google token
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })
    const googleUser = ticket.getPayload()
    if (!googleUser) {
      throw new Error('Invalid Google token')
    }

    this.logger.debug('Google login success', { user: googleUser })

    // 验证是否已经存在
    const userInfo = await this.userRepository.getUserInfoByMail(googleUser.email)

    if (userInfo && !userInfo.isDelete) {
      return userInfo
    }

    const googleAccount = {
      googleId: googleUser.sub,
      email: googleUser.email,
      refreshToken: null,
    }

    const newData = new NewUser(UserCreateType.google, googleUser.email, googleAccount)

    const res = await this.userRepository.create(newData)
    const newUserInfo = res.toJSON()
    this.afterCreate(newUserInfo)
    return userInfo
  }

  // 判断会员权益
  async checkUserVipRights(userId: string): Promise<User> {
    const userInfo = await this.getUserInfoById(userId)
    if (userInfo.status !== UserStatus.OPEN)
      throw new AppException(1000, 'The user has been banned and is unable to create tasks')
    if (
      !userInfo.vipInfo
      || dayjs(userInfo.vipInfo.expireTime).valueOf() < Date.now()
    ) {
      throw new AppException(1000, 'The user membership has expired. Please renew it')
    }
    return userInfo
  }

  /** 获取我的积分记录 */
  async getMyPointsRecords(userId: string, page = 1, pageSize = 10) {
    return await this.pointsService.getRecords(userId, page, pageSize)
  }

  /**
   * 登陆之后的逻辑处理
   * @param user
   * @returns
   */
  async afterLogin(user: User) {
    // 上报用户数据
    await this.queueService.addTaskUserPortraitReportJob({
      userId: user.id,
      lastLoginTime: (new Date()).toISOString(),
    })
    return true
  }

  /**
   * 谷歌用户注销登录
   * @param clientId
   * @param credential
   * @param token
   * @returns
   */
  async cancelLoginByGoogle(clientId: string, credential: string, token: string) {
    const params = new URLSearchParams({
      token,
    })
    const response = await axios.post(
      'https://oauth2.googleapis.com/revoke',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )

    return response
  }

  /**
   * 用户创建后
   * @param user
   * @returns
   */
  private async afterCreate(
    user: User,
  ) {
    // 创建默认的素材组/草稿箱组
    this.materialGroupRepository.createDefault(user.id)
    this.mediaGroupRepository.createDefault(user.id)

    // 上报用户数据
    await this.queueService.addTaskUserPortraitReportJob({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      status: UserStatus.OPEN,
      lastLoginTime: (new Date()).toISOString(),
    })

    // 生成推广码
    this.generateUsePopularizeCode(user.id)
    // 用户创建积分
    this.pointsService.addPoints({
      userId: user.id,
      amount: 10,
      type: 'user_register',
      description: '用户注册成功，获得10积分',
    })

    if (user.inviteCode) {
      const inviteUser = await this.getUserByPopularizeCode(user.inviteCode)
      if (inviteUser) {
        this.pointsService.addPoints({
          userId: inviteUser.id,
          amount: 20,
          type: 'user_invite',
          description: '用户邀请成功，获得20积分',
        })

        this.pointsService.addPoints({
          userId: user.id,
          amount: 20,
          type: 'user_invite',
          description: '被用户邀请成功，获得20积分',
        })
      }
    }
    // 派发新号任务
    await this.queueService.addTaskUserCreatePushJob({ userId: user.id })
  }
}
