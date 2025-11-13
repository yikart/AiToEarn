import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AppException, ResponseCode } from '@yikart/common'
import { MaterialGroupRepository, MediaGroupRepository, User, UserAiInfo, UserRepository, UserStatus } from '@yikart/mongodb'
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
   * Get user information
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
   * Get user information
   * @param id
   * @returns
   */
  async getUserInfoById(id: string) {
    const res = await this.userRepository.getUserInfoById(id)
    void this.redisService.setJson(`UserInfo:${id}`, res)
    if (!res)
      throw new AppException(ResponseCode.UserNotFound)

    const vipInfo = await this.vipService.getVipInfo(res)

    res.vipInfo = vipInfo || undefined
    return res
  }

  /**
   * Get user by invite code
   * @param inviteCode
   * @returns
   */
  async getUserByPopularizeCode(inviteCode: string): Promise<User | null> {
    const res = await this.userRepository.getUserByPopularizeCode(inviteCode)
    return res
  }

  /**
   * Create user by email
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
   * Update user password
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
   * Update user information
   * @param id
   * @param newdData
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
   * Update user status
   * @param id
   * @param status
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
   * Delete user
   * @param id
   * @returns
   */
  async delete(
    id: string,
  ): Promise<boolean> {
    const res = await this.userRepository.deleteUser(id)
    return res
  }

  /**
   * Generate user invite code
   * @param id
   * @returns
   */
  async generateUsePopularizeCode(id: string) {
    const user = await this.getUserInfoById(id)
    if (!user)
      throw new AppException(ResponseCode.UserNotFound)
    const res = await this.userRepository.generateUsePopularizeCode(user)
    this.redisService.del(`UserInfo:${id}`)
    return res
  }

  /**
   * Get or create user by Google authentication
   * @param clientId
   * @param credential
   * @returns
   */
  async getUserInfoByGoogle(
    clientId: string,
    credential: string,
  ): Promise<User | null> {
    this.logger.debug('Verifying Google token')
    // Verify Google token
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })
    const googleUser = ticket.getPayload()
    if (!googleUser) {
      throw new Error('Invalid Google token')
    }

    this.logger.debug('Google login success', { user: googleUser })

    // Check if user already exists
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
    return newUserInfo
  }

  // Check user VIP rights
  async checkUserVipRights(userId: string): Promise<User> {
    const userInfo = await this.getUserInfoById(userId)
    if (userInfo.status !== UserStatus.OPEN)
      throw new AppException(ResponseCode.UserBanned)
    if (
      !userInfo.vipInfo
      || dayjs(userInfo.vipInfo.expireTime).valueOf() < Date.now()
    ) {
      throw new AppException(ResponseCode.UserMembershipExpired)
    }
    return userInfo
  }

  /** Get my points records */
  async getMyPointsRecords(userId: string, page = 1, pageSize = 10) {
    return await this.pointsService.getRecords(userId, page, pageSize)
  }

  /**
   * Logic after login
   * @param _user
   * @returns
   */
  async afterLogin(_user: User) {

  }

  /**
   * Cancel Google login
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
   * After user creation
   * @param user
   * @returns
   */
  private async afterCreate(
    user: User,
  ) {
    // Create default material/media groups
    this.materialGroupRepository.createDefault(user.id)
    this.mediaGroupRepository.createDefault(user.id)

    // Generate invite code
    this.generateUsePopularizeCode(user.id)
    // Add points for user registration
    this.pointsService.addPoints({
      userId: user.id,
      amount: 10,
      type: 'user_register',
      description: 'User registered successfully, earned 10 points',
    })

    if (user.inviteCode) {
      const inviteUser = await this.getUserByPopularizeCode(user.inviteCode)
      if (inviteUser) {
        this.pointsService.addPoints({
          userId: inviteUser.id,
          amount: 20,
          type: 'user_invite',
          description: 'User invited successfully, earned 20 points',
        })

        this.pointsService.addPoints({
          userId: user.id,
          amount: 20,
          type: 'user_invite',
          description: 'Invited by user successfully, earned 20 points',
        })
      }
    }
  }

  async setAiConfig(userId: string, aiConfig: Partial<UserAiInfo>): Promise<boolean> {
    const res = await this.userRepository.setAiConfig(userId, aiConfig)
    this.redisService.del(`UserInfo:${userId}`)
    return res
  }

  async setAiConfigItem(userId: string, type: 'image' | 'edit' | 'video' | 'agent', value: {
    defaultModel: string
    option?: Record<string, any>
  }): Promise<boolean> {
    const res = await this.userRepository.setAiConfigItem(userId, type, value)
    this.redisService.del(`UserInfo:${userId}`)
    return res
  }
}
