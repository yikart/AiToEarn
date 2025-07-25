import * as crypto from 'node:crypto'
import { User, UserStatus, UserWallet } from '@libs/database/schema'
import { RedisService } from '@libs/redis'
/*
 * @Author: nevin
 * @Date: 2024-08-15 11:15:28
 * @LastEditTime: 2024-11-04 14:39:44
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { google } from 'googleapis'
import { Model } from 'mongoose'
import { NewUserByGoogle, NewUserByMail } from './class/user.class'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  private oauth2Client: any

  constructor(
    private readonly redisService: RedisService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(UserWallet.name)
    private readonly userWalletModel: Model<UserWallet>,
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
    inviteCode?: string,
  ): Promise<User> {
    const newData = new NewUserByMail(mail, password)
    newData.inviteCode = inviteCode

    const res = await this.userModel.create(newData)
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

  /**
   * 生成推广码
   * @param userId
   * @returns
   */
  async generateUsePopularizeCode(userId: string) {
    const userInfo = await this.getUserInfoById(userId)
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
      .update(userId)
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
      { _id: userId },
      { $set: { popularizeCode: code } },
    )
    this.redisService.del(`UserInfo:${userId}`)

    return code
  }

  /**
   * 更新用户密码
   * @param mail
   * @param password
   * @returns
   */
  // 更新密码
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
   * @param googleAccount
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

    const newData = new NewUserByGoogle(googleUser.email, googleAccount)

    await this.userModel.create(newData)
    return newData
  }
}
