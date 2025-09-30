import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { User, UserRepository, UserStatus } from '@yikart/mongodb'
import { NatsClient } from '@yikart/nats-client'
import { Common } from 'googleapis'
import { PointsService } from '../points/points.service'
import { NewUser, UserCreateType } from './class/user.class'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  private oauth2Client: Common.OAuth2Client

  constructor(
    private readonly userRepository: UserRepository,
    private readonly pointsService: PointsService,
    private readonly natsClient: NatsClient,
  ) {
    this.oauth2Client = new Common.OAuth2Client()
  }

  async getUserInfoById(id: string, all = false) {
    let userInfo
    try {
      if (all) {
        userInfo = await this.userRepository.getByIdWithPassword(id)
      }
      else {
        userInfo = await this.userRepository.getById(id)
      }
    }
    catch {
      // Logger.error(error);
      return null
    }
    return userInfo
  }

  async getUserInfoByMail(mail: string, all = false) {
    if (all) {
      const userInfo = await this.userRepository.getUserByMailWithPassword(mail)
      return userInfo
    }
    return await this.userRepository.getUserByMail(mail)
  }

  /**
   * 根据推广码获取用户信息
   * @param popularizeCode
   * @returns
   */
  async getUserByPopularizeCode(popularizeCode: string): Promise<User | null> {
    const userInfo = await this.userRepository.getUserByPopularizeCode(popularizeCode)
    return userInfo
  }

  /**
   * 邮箱创建用户
   * @param mail
   * @param password
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
    if (inviteCode) {
      newData.inviteCode = inviteCode
    }

    const res = await this.userRepository.create(newData)
    this.afterCreate(res)
    return res
  }

  // 更新
  async updateUserInfo(id: string, newData: Partial<User>): Promise<boolean> {
    const res = await this.userRepository.updateById(id, newData)
    return res !== null
  }

  // 更新状态
  async updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
    const res = await this.userRepository.updateById(id, { status })
    return res !== null
  }

  async deleteUser(id: string): Promise<boolean> {
    const res = await this.userRepository.updateById(id, { isDelete: true })
    return res !== null
  }

  /**
   * 生成推广码
   * @param userInfo
   * @returns
   */
  async generateUsePopularizeCode(userInfo: User) {
    if (!userInfo)
      return null
    // 先对手机号进行哈希处理
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
    await this.userRepository.updateById(userInfo.id, { popularizeCode: code })

    return code
  }

  /**
   * 更新用户密码
   * @param mail
   * @param newData
   * @returns
   */
  async updateUserPassword(
    id: string,
    newData: {
      password: string
      salt: string
    },
  ): Promise<0 | 1> {
    const res = await this.userRepository.updateById(id, {
      password: newData.password,
      salt: newData.salt,
    })

    return res !== null ? 1 : 0
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
    const userInfo = await this.userRepository.getUserByMail(googleUser.email!)

    if (userInfo && !userInfo.isDelete) {
      return userInfo
    }

    const googleAccount = {
      googleId: googleUser.sub,
      email: googleUser.email,
      refreshToken: null,
    }

    const newData = new NewUser(UserCreateType.google, googleUser.email!, googleAccount)

    const res = await this.userRepository.create(newData)
    this.logger.debug('User created----------', res)
    this.afterCreate(res)
    this.logger.log('User created end----------', res)
    return res
  }

  /**
   * 用户创建后
   * @param user
   * @returns
   */
  private async afterCreate(
    user: User,
  ) {
    // 发送用户创建广播
    this.natsClient.emit('user.create', { userId: user.id })

    // 上报用户数据
    this.userPortraitReport({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      status: UserStatus.OPEN,
      lastLoginTime: new Date(),
    })

    // 生成推广码
    this.generateUsePopularizeCode(user)
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
    this.pushTaskWithUserCreate(user.id)
  }

  /**
   * 用户数据上报
   */
  async userPortraitReport(data: {
    userId: string
    name?: string
    avatar?: string
    status?: number
    lastLoginTime?: Date
    contentTags?: Record<string, number>
    totalFollowers?: number
    totalWorks?: number
    totalViews?: number
    totalLikes?: number
    totalCollects?: number
  }) {
    const res = await this.natsClient.send<void>(
      'task.userPortrait.report',
      { ...data, ...(data.lastLoginTime && { lastLoginTime: data.lastLoginTime.toISOString() }) },
    )

    return res
  }

  async pushTaskWithUserCreate(userId: string) {
    return await this.natsClient.send<void>('task.push.withUserCreate', {
      userId,
    })
  }
}
