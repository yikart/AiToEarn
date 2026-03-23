import type { Locale } from '@yikart/common'
import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AppException, getLocale, ResponseCode } from '@yikart/common'
import { MaterialGroupRepository, MediaGroupRepository, User, UserAiInfo, UserRepository, UserStatus, UserType } from '@yikart/mongodb'
import { PsChannel, RedisPubSubService, RedisService } from '@yikart/redis'
import axios from 'axios'
import { google } from 'googleapis'
import { NewUser, UserCreateType } from './class/user.class'
import { ReportLocationDto, UpdateUserInfoDto } from './user.dto'

@Injectable()
export class UserService {
  logger = new Logger(UserService.name)
  // eslint-disable-next-line ts/no-explicit-any
  private oauth2Client: any

  constructor(
    private readonly queueService: QueueService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly redisPubSubService: RedisPubSubService,
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
    const res = await this.userRepository.getByMail(mail, all)
    if (!res)
      return null
    return res
  }

  async getUserToRegister(mail: string) {
    try {
      const res = await this.userRepository.getByMailForRegister(mail)
      return res
    }
    catch (error) {
      this.logger.error(error)
      throw new AppException(ResponseCode.TooManyRequests)
    }
  }

  /**
   * Get user information
   * @param id
   * @returns
   */
  async getUserInfoById(id: string) {
    const res = await this.userRepository.getById(id)
    void this.redisService.setJson(`UserInfo:${id}`, res)
    if (!res)
      throw new AppException(ResponseCode.UserNotFound)

    return res
  }

  /**
   * Get user by invite code
   * @param inviteCode
   * @returns
   */
  async getUserByPopularizeCode(inviteCode: string): Promise<User | null> {
    const res = await this.userRepository.getByPopularizeCode(inviteCode)
    return res
  }

  async getUserInfoByPhone(phone: string): Promise<User | null> {
    const res = await this.userRepository.getByPhone(phone)
    if (!res)
      return null
    return res
  }

  async createUserByPhone(phone: string): Promise<User> {
    const newData = new NewUser(UserCreateType.phone, phone)
    newData.locale = getLocale()
    const userInfo = await this.userRepository.create(newData)
    this.afterCreate(userInfo)
    return userInfo
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
    inviteCode?: string,
  ): Promise<User> {
    const newData = new NewUser(UserCreateType.mail, mail)
    newData.inviteCode = inviteCode
    newData.locale = getLocale()

    const userInfo = await this.userRepository.create(
      newData,
    )
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
  async updatePasswordById(id: string, password: string, salt: string): Promise<boolean> {
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
    const res = await this.userRepository.updateById(id, { $set: newdData })
    return res !== null
  }

  async updateLocation(id: string, data: ReportLocationDto): Promise<boolean> {
    const res = await this.userRepository.updateById(id, { $set: { location: data } })
    this.redisService.del(`UserInfo:${id}`)
    return res !== null
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
    const res = await this.userRepository.softDeleteById(id)
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
    const res = await this.userRepository.updatePopularizeCodeById(user)
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

    this.logger.debug('Google login success', {
      userId: googleUser.id,
      email: googleUser.email,
    })

    // Check if user already exists
    try {
      const userInfo = await this.userRepository.getByMailForRegister(googleUser.email)
      if (userInfo && !userInfo.isDelete) {
        return userInfo
      }
    }
    catch (error) {
      this.logger.error(error)
      throw new AppException(ResponseCode.TooManyRequests)
    }

    const googleAccount = {
      googleId: googleUser.sub,
      email: googleUser.email,
      refreshToken: null,
    }

    const newData = new NewUser(UserCreateType.google, googleUser.email, googleAccount)
    newData.locale = getLocale()

    const res = await this.userRepository.create(newData)
    const newUserInfo = res
    this.afterCreate(newUserInfo)
    return newUserInfo
  }

  /**
   * Logic after login
   * @param user
   * @returns
   */
  async afterLogin(user: User) {
    const locale = getLocale()
    if (user.locale !== locale) {
      this.userRepository.updateById(user.id, { locale })
    }

    return true
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
    await this.generateUsePopularizeCode(user.id)
    this.redisPubSubService.emit(PsChannel.USER_CREATE, user)
  }

  async setAiConfig(userId: string, aiConfig: Partial<UserAiInfo>): Promise<boolean> {
    const res = await this.userRepository.updateAiConfigById(userId, aiConfig)
    this.redisService.del(`UserInfo:${userId}`)
    return res
  }

  async setAiConfigItem(userId: string, type: 'image' | 'edit' | 'video' | 'agent', value: {
    defaultModel: string
    // eslint-disable-next-line ts/no-explicit-any
    option?: Record<string, any>
  }): Promise<boolean> {
    const res = await this.userRepository.updateAiConfigItemById(userId, type, value)
    this.redisService.del(`UserInfo:${userId}`)
    return res
  }

  /**
   * 批量获取用户信息
   * @param userIds 用户ID列表
   * @returns 用户信息列表
   */
  async listUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) {
      return []
    }
    return this.userRepository.listByIds(userIds)
  }

  /**
   * 切换用户身份类型
   * @param userId 用户ID
   * @param userType 目标用户类型
   * @returns 是否切换成功
   */
  async updateLocale(userId: string, locale: Locale): Promise<boolean> {
    const res = await this.userRepository.updateById(userId, { $set: { locale } })
    this.redisService.del(`UserInfo:${userId}`)
    return res !== null
  }

  async switchUserType(userId: string, userType: UserType): Promise<boolean> {
    const result = await this.userRepository.updateUserTypeById(userId, userType)
    if (result) {
      this.redisService.del(`UserInfo:${userId}`)
    }
    return result
  }
}
