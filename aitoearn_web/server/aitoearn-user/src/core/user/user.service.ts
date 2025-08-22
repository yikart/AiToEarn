import * as crypto from 'node:crypto'
import { User, UserStatus } from '@libs/database/schema'
import { RedisService } from '@libs/redis'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { google } from 'googleapis'
import { Model } from 'mongoose'
import { NatsService } from '@/transports/nats.service'
import { PointsService } from '../points/points.service'
import { NewUser, UserCreateType } from './class/user.class'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  private oauth2Client: any

  constructor(
    private readonly redisService: RedisService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly pointsService: PointsService,
    private readonly natsService: NatsService,
  ) {
    this.oauth2Client = new google.auth.OAuth2()
  }

  async getUserInfoById(id: string, all = false) {
    const key = `UserInfo:${id}`
    let userInfo
    // let userInfo = await this.redisService.get<User>(key);
    // if (userInfo) return userInfo;
    try {
      const db = this.userModel.findById(id)
      if (all)
        db.select('+password +salt')
      userInfo = await db.exec()
    }
    catch {
      // Logger.error(error);
      return null
    }
    void this.redisService.setKey(key, userInfo)
    return userInfo

    // console.log('id', id);
    // const userInfo = await this.userModel.findOne({ _id: id });
    // console.log('userInfo', userInfo);
    // return userInfo;
  }

  async getUserInfoByMail(mail: string, all = false) {
    const db = this.userModel.findOne({
      mail,
      status: UserStatus.OPEN,
    })
    if (all)
      db.select('+password +salt')
    const userInfo = await db.exec()

    return userInfo
  }

  /**
   * 根据推广码获取用户信息
   * @param popularizeCode
   * @returns
   */
  async getUserByPopularizeCode(popularizeCode: string): Promise<User | null> {
    const userInfo = await this.userModel.findOne({
      popularizeCode,
      status: UserStatus.OPEN,
    })
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
    newData.inviteCode = inviteCode

    const res = await this.userModel.create(newData)
    this.afterCreate(res)
    return res
  }

  // 更新
  async updateUserInfo(id: string, newData: Partial<User>): Promise<boolean> {
    const res = await this.userModel.updateOne(
      { _id: id },
      { $set: { ...newData } },
    )
    return res.modifiedCount > 0
  }

  // 更新状态
  async updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
    const res = await this.userModel.updateOne(
      { _id: id },
      { $set: { status } },
    )
    return res.modifiedCount > 0
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
    await this.userModel.updateOne(
      { _id: userInfo.id },
      { $set: { popularizeCode: code } },
    )
    this.redisService.del(`UserInfo:${userInfo.id}`)

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
    const res = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          password: newData.password,
          salt: newData.salt,
        },
      },
    )

    this.redisService.del(`UserInfo:${id}`)
    return res.modifiedCount > 0 ? 1 : 0
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
    const db = this.userModel.findOne({
      mail: googleUser.email,
      status: UserStatus.OPEN,
    })
    const userInfo = await db.exec()

    if (userInfo) {
      return userInfo
    }

    const googleAccount = {
      googleId: googleUser.sub,
      email: googleUser.email,
      refreshToken: null,
    }

    const newData = new NewUser(UserCreateType.google, googleUser.email, googleAccount)

    const res = await this.userModel.create(newData)
    this.afterCreate(res)
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
    this.natsService.publishEvent('user.create', { userId: user.id })

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
    // 积分
  }
}
