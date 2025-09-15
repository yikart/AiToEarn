import { Injectable } from '@nestjs/common'
import { NatsClient } from '@yikart/nats-client'
import {
  AddPointsDto,
  DeductPointsDto,
  GetUserByPopularizeCodeDto,
  GoogleLoginDto,
  NewMailDto,
  PointsBalanceDto,
  PointsBalanceVo,
  PointsRecordsDto,
  PointsRecordsVo,
  SuccessResponse,
  UpdateUserInfoDto,
  UpdateUserPasswordDto,
  UpdateUserStatusDto,
  UpdateVipInfoDto,
  User,
  UserIdDto,
  UserInfoDto,
  UserListDto,
  UserListResponse,
  UserMailDto,
  VipSetResponse,
} from './aitoearn-user-client.interface'

@Injectable()
export class AitoearnUserClient {
  constructor(private readonly natsClient: NatsClient) {}

  // ==================== 用户模块 ====================

  /**
   * 通过邮箱创建用户
   */
  async createUserByMail(dto: NewMailDto): Promise<User> {
    return this.natsClient.send<User>('user.user.createUserByMail', dto)
  }

  /**
   * 通过邮箱获取用户信息
   */
  async getUserInfoByMail(dto: UserMailDto): Promise<User> {
    return this.natsClient.send<User>('user.user.getUserInfoByMail', dto)
  }

  /**
   * 通过ID获取用户信息
   */
  async getUserInfoById(dto: UserInfoDto): Promise<User | null> {
    return this.natsClient.send<User>('user.user.getUserInfoById', dto)
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(dto: UpdateUserInfoDto): Promise<User> {
    return this.natsClient.send<User>('user.user.updateUserInfo', dto)
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(dto: UpdateUserStatusDto): Promise<User> {
    return this.natsClient.send<User>('user.user.updateUserStatus', dto)
  }

  /**
   * 更新用户密码
   */
  async updateUserPassword(dto: UpdateUserPasswordDto): Promise<User> {
    return this.natsClient.send<User>('user.user.updateUserPassword', dto)
  }

  /**
   * 谷歌登录获取用户信息
   */
  async getUserInfoByGoogle(dto: GoogleLoginDto): Promise<User> {
    return this.natsClient.send<User>('user.user.getUserInfoByGoogle', dto)
  }

  // ==================== 用户推广模块 ====================

  /**
   * 生成用户推广码
   */
  async generatePopularizeCode(dto: UserIdDto): Promise<string> {
    return this.natsClient.send<string>('user.user.generatePopCode', dto)
  }

  /**
   * 通过推广码获取用户信息
   */
  async getUserByPopularizeCode(dto: GetUserByPopularizeCodeDto): Promise<User> {
    return this.natsClient.send<User>('user.user.getUserByPopularizeCode', dto)
  }

  // ==================== 积分模块 ====================

  /**
   * 获取用户积分余额
   */
  async getPointsBalance(dto: PointsBalanceDto): Promise<PointsBalanceVo> {
    return this.natsClient.send<PointsBalanceVo>('user.points.get', dto)
  }

  /**
   * 获取积分记录列表
   */
  async getPointsRecords(dto: PointsRecordsDto): Promise<PointsRecordsVo> {
    return this.natsClient.send<PointsRecordsVo>('user.points.getRecords', dto)
  }

  /**
   * 增加积分
   */
  async addPoints(dto: AddPointsDto): Promise<SuccessResponse> {
    return this.natsClient.send<SuccessResponse>('user.points.add', dto)
  }

  /**
   * 扣减积分
   */
  async deductPoints(dto: DeductPointsDto): Promise<SuccessResponse> {
    return this.natsClient.send<SuccessResponse>('user.points.deduct', dto)
  }

  // ==================== VIP模块 ====================

  /**
   * 设置VIP信息
   */
  async setVipInfo(dto: UpdateVipInfoDto): Promise<VipSetResponse> {
    return this.natsClient.send<VipSetResponse>('user.vip.set', dto)
  }

  // ==================== 管理员用户模块 ====================

  /**
   * 获取用户列表（管理员）
   */
  async getUserList(dto: UserListDto): Promise<UserListResponse> {
    return this.natsClient.send<UserListResponse>('user.admin.user.list', dto)
  }
}
