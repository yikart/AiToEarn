import { Injectable, Logger } from '@nestjs/common'
import { AppException, Pagination, ResponseCode } from '@yikart/common'
import { PointsRecordRepository, Transactional, UserRepository } from '@yikart/mongodb'
import { AddPointsDto, DeductPointsDto } from './points.dto'

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly pointsRecordRepository: PointsRecordRepository,
  ) { }

  /**
   * 获取用户积分余额
   * @param userId 用户ID
   * @returns 用户积分余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }
    return user.score || 0
  }

  /**
   * 获取积分记录列表
   * @param userId 用户ID
   * @param pagination 分页参数
   * @returns 积分记录列表
   */
  async getRecords(userId: string, pagination: Pagination) {
    return await this.pointsRecordRepository.listWithPagination({
      page: pagination.page,
      pageSize: pagination.pageSize,
      userId,
    })
  }

  /**
   * 获取本月vip增加积分记录
   * @param userId 用户ID
   * @returns
   */
  async findVipOpintsAddRepordOfMonth(userId: string) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date()

    return await this.pointsRecordRepository.listByUserId({
      userId,
      type: 'vip_points',
      createdAt: [startOfMonth, endOfMonth],
    })
  }

  /**
   * 增加积分
   * @param data 添加积分的数据
   */
  @Transactional()
  async addPoints(data: AddPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    await this.userRepository.updateById(userId, {
      $inc: { score: amount },
    })

    await this.pointsRecordRepository.create({
      userId,
      amount,
      balance: user.score + amount,
      type,
      description,
      metadata,
    })
  }

  /**
   * 扣减积分
   * @param data 扣减积分的数据
   */
  @Transactional()
  async deductPoints(data: DeductPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data

    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    if (user.score < amount) {
      throw new AppException(ResponseCode.UserPointsInsufficient)
    }
    await this.userRepository.updateById(userId, {
      $inc: { score: -amount },
    })

    const newBalance = user.score - amount
    await this.pointsRecordRepository.create({
      userId,
      amount: -amount,
      balance: newBalance,
      type,
      description,
      metadata,
      createdAt: new Date(),
    })
  }
}
