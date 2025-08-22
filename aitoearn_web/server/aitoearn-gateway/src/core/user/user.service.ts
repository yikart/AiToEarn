import { Injectable } from '@nestjs/common'
import { User, UserStatus, UserVipCycleType } from 'src/transports/user/comment'
import { UserNatsApi } from 'src/transports/user/user.natsApi'
import { UserVipNatsApi } from 'src/transports/user/vip.natsApi'
import { UserPointsNatsApi } from '@/transports/user/points.natsApi'
import { UpdateUserInfoDto } from './dto/user.dto'

@Injectable()
export class UserService {
  constructor(
    private readonly userNatsApi: UserNatsApi,
    private readonly userVipNatsApi: UserVipNatsApi,
    private readonly userPointsNatsApi: UserPointsNatsApi,
  ) {}

  /**
   * 获取用户信息
   * @param mail
   * @returns
   */
  async getUserInfoByMail(mail: string, all = false) {
    const res = await this.userNatsApi.getUserInfoByMail(mail, all)
    return res
  }

  /**
   * 获取用户信息
   * @param id
   * @returns
   */
  async getUserInfoById(id: string, all = false): Promise<User> {
    const res = await this.userNatsApi.getUserInfoById(id, all)
    return res
  }

  /**
   * 根据推广码获取用户信息
   * @param inviteCode
   * @returns
   */
  async getUserByPopularizeCode(inviteCode: string): Promise<User> {
    const res = await this.userNatsApi.getUserByPopularizeCode(inviteCode)
    return res
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
    const res = await this.userNatsApi.createUserByMail(
      mail,
      password,
      salt,
      inviteCode,
    )
    return res
  }

  /**
   * 更新用户密码
   * @param id
   * @param password
   * @param salt
   * @returns
   */
  async updateUserPassword(id: string, password: string, salt: string): Promise<boolean> {
    const res = await this.userNatsApi.updateUserPassword(id, password, salt)
    return res
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
    const res = await this.userNatsApi.updateUserInfo(id, newdData)
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
    const res = await this.userNatsApi.updateUserStatus(id, status)
    return res
  }

  /**
   * 生成用户推广码
   * @returns
   */
  async generateUsePopularizeCode(id: string) {
    const res = await this.userNatsApi.generateUsePopularizeCode(id)
    return res
  }

  /**
   * 获取谷歌用户信息
   * @param mail
   * @returns
   */
  async getUserInfoByGoogle(clientId: string, credential: string) {
    const res = await this.userNatsApi.getUserInfoByGoogle(
      clientId,
      credential,
    )
    return res
  }

  /**
   * 获取用户信息
   * @param mail
   * @returns
   */
  async setUserVipInfo(userId: string, cycleType: UserVipCycleType) {
    const res = await this.userVipNatsApi.setUserVipInfo(userId, cycleType)

    return res
  }

  /** 获取我的积分记录 */
  async getMyPointsRecords(userId: string, page = 1, pageSize = 10) {
    return await this.userPointsNatsApi.getRecords(userId, page, pageSize)
  }
}
