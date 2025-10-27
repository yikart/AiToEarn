import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AppException, ResponseCode } from '@yikart/common'
import { PointsRecordRepository, User, UserRepository, UserStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import dayjs from 'dayjs'
import * as _ from 'lodash'
import { AddPointsDto, DeductPointsDto } from './dto/points.dto'

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name)

  constructor(
    private readonly redisService: RedisService,
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
      throw new AppException(ResponseCode.UserNotFound, 'User not found')
    }
    return user.score || 0
  }

  /**
   * 获取积分记录列表
   * @param userId 用户ID
   * @param page 每页数量
   * @param pageSize 偏移量
   * @returns 积分记录列表
   */
  async getRecords(userId: string, page = 1, pageSize = 10) {
    const [list, total] = await this.pointsRecordRepository.listWithPagination({
      userId,
      page,
      pageSize,
    })
    return { list, total }
  }

  /**
   * 获取本月vip增加积分记录
   * @param userId 用户ID
   * @returns
   */
  async findVipOpintsAddRepordOfMonth(userId: string) {
    return await this.pointsRecordRepository.findVipOpintsAddRepordOfMonth(userId)
  }

  /**
   * 增加积分
   * @param data 添加积分的数据
   */
  async addPoints(data: AddPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound, 'User not found')
    }

    await this.pointsRecordRepository.addPoints(user, {
      amount,
      type,
      description,
      metadata,
    })
    this.redisService.del(`UserInfo:${userId}`)
  }

  /**
   * 扣减积分
   * @param data 扣减积分的数据
   */
  async deductPoints(data: DeductPointsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound, 'User not found')
    }

    // 检查用户积分余额是否充足
    if (user.score < amount) {
      throw new AppException(ResponseCode.UserInsufficientBalance, 'Insufficient balance')
    }

    await this.pointsRecordRepository.deductPoints(user, {
      amount,
      type,
      description,
      metadata,
    })
    this.redisService.del(`UserInfo:${userId}`)
  }

  // 每天凌晨1点检查每天用户变动的用户里，找出所有的花费日志行为，标记为抵扣，计算出来总数
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async dailyDiKouCostCheck() {
    const lockKey = 'points:daily:cost:deduction:lock'
    const lockValue = await this.redisService.get(lockKey)

    if (lockValue) {
      this.logger.warn('Daily cost deduction already processed today')
      return
    }

    // 设置锁，24小时过期
    await this.redisService.set(lockKey, '1', 60 * 60 * 24)

    try {
      const updatedAt = {
        $lt: dayjs().startOf('day').valueOf(),
        $gte: dayjs().startOf('day').subtract(1, 'd').valueOf(),
      }
      const condition = { status: UserStatus.OPEN, updatedAt }

      let processedUsers = 0
      let failedUsers = 0

      const cursor = this.userRepository.getCursor(condition, 'id status updatedAt')

      for (let user = await cursor.next(); user !== null; user = await cursor.next()) {
        if (_.isEmpty(user))
          continue

        try {
          await this.diKouCostByUser(user, updatedAt)
          processedUsers++
        }
        catch (error) {
          failedUsers++
          this.logger.error(`Failed to process cost deduction for user ${user.id}`, error)
        }
      }

      this.logger.log(`Daily cost deduction completed. Processed: ${processedUsers}, Failed: ${failedUsers}`)
    }
    catch (error) {
      // 删除锁，允许重试
      await this.redisService.del(lockKey)
      throw error
    }
  }

  async diKouCostByUser(user: User, updatedAt: any) {
    return await this.pointsRecordRepository.diKouCostByUser(user, updatedAt)
  }

  // 每天检查每位用户的积分过期情况
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkPointExpiration() {
    const lockKey = 'points:daily:expiration:check:lock'
    const lockValue = await this.redisService.get(lockKey)

    if (lockValue) {
      this.logger.warn('Daily point expiration check already processed today')
      return
    }

    // 设置锁，24小时过期
    await this.redisService.set(lockKey, '1', 60 * 60 * 24)

    try {
      this.logger.log('Starting daily point expiration check')

      let processedUsers = 0
      let failedUsers = 0

      const cursor = this.userRepository.getCursor({ status: UserStatus.OPEN, score: { $gt: 0 } }, 'id status updatedAt')

      for (let user = await cursor.next(); user !== null; user = await cursor.next()) {
        if (_.isEmpty(user))
          continue

        try {
          await Promise.all([
            this.getPointBySub(user),
            this.getPoint10DayExp(user),
          ])
          processedUsers++
        }
        catch (error) {
          failedUsers++
          this.logger.error(`Failed to process point expiration for user ${user.id}`, error)
        }
      }

      this.logger.log(`Daily point expiration check completed. Processed: ${processedUsers}, Failed: ${failedUsers}`)
    }
    catch (error) {
      this.logger.error('Daily point expiration check failed', error)
      // 删除锁，允许重试
      await this.redisService.del(lockKey)
      throw error
    }
  }

  async getPointBySub(user: User) {
    await this.pointsRecordRepository.getPointBySub(user)
    this.redisService.del(`UserInfo:${user.id}`)
  }

  async getPoint10DayExp(user: User) {
    await this.pointsRecordRepository.getPoint10DayExp(user)
  }
}
