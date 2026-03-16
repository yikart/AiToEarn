import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CreditsType, WithLoggerContext } from '@yikart/common'
import { AddCreditsDto, CreditsHelperService, DeductCreditsDto } from '@yikart/helpers'
import { CreditsBalanceRepository, CreditsRecord, CreditsRecordRepository, Transactional } from '@yikart/mongodb'
import { Redlock } from '@yikart/redlock'
import { BigNumber } from 'bignumber.js'
import { RedlockKey } from '../../common/enums'
import { CreditsRecordsDto } from './credits.dto'

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name)

  constructor(
    private readonly creditsHelper: CreditsHelperService,
    private readonly creditsRecordRepository: CreditsRecordRepository,
    private readonly creditsBalanceRepository: CreditsBalanceRepository,
  ) { }

  /**
   * 获取用户Credits余额
   * @param userId 用户ID
   * @returns Credits余额（美分）
   */
  async getBalance(userId: string): Promise<number> {
    return this.creditsHelper.getBalance(userId)
  }

  /**
   * 获取Credits记录列表
   * @param userId 用户ID
   * @param query 分页查询参数
   * @returns Credits记录列表和总数
   */
  async getRecords(userId: string, query: CreditsRecordsDto) {
    const [list, total] = await this.creditsRecordRepository.listWithPagination({
      userId,
      ...query,
    })
    return [list, total] as const
  }

  /**
   * 增加Credits
   * @param data 添加Credits的数据
   */
  async addCredits(data: AddCreditsDto): Promise<void> {
    return this.creditsHelper.addCredits(data)
  }

  /**
   * 扣减Credits
   * @param data 扣减Credits的数据
   */
  async deductCredits(data: DeductCreditsDto): Promise<void> {
    return this.creditsHelper.deductCredits(data)
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Redlock(RedlockKey.CreditsExpirationCheck, 60, { throwOnFailure: false })
  @WithLoggerContext()
  @Transactional()
  async checkCreditsExpiration() {
    this.logger.debug('Starting daily credits expiration check')

    const expiredRecords = await this.creditsRecordRepository.listExpiredCredits()

    if (expiredRecords.length === 0) {
      this.logger.debug('No expired credits found')
      return
    }

    this.logger.debug(`Found ${expiredRecords.length} expired credits records`)

    const userExpiredBalances = new Map<string, { records: CreditsRecord[], totalBalance: number }>()

    for (const record of expiredRecords) {
      const userId = record.userId
      if (!userExpiredBalances.has(userId)) {
        userExpiredBalances.set(userId, { records: [], totalBalance: 0 })
      }
      const userData = userExpiredBalances.get(userId)!
      userData.records.push(record)
      const currentTotalBN = new BigNumber(userData.totalBalance)
      const recordBalanceBN = new BigNumber(record.balance)
      userData.totalBalance = currentTotalBN.plus(recordBalanceBN).toNumber()
    }

    let processedUsers = 0
    let failedUsers = 0

    for (const [userId, { records, totalBalance }] of userExpiredBalances) {
      try {
        await this.creditsBalanceRepository.decrement(userId, totalBalance)

        const recordIds = records.map(r => r.id)
        await this.creditsRecordRepository.resetBalances(recordIds)

        await this.creditsRecordRepository.create({
          userId,
          amount: -totalBalance,
          balance: 0,
          type: CreditsType.Expired,
          description: 'Credits expired by scheduled task',
          metadata: {
            expiredRecords: records.map(r => ({ id: r.id, amount: r.amount, balance: r.balance })),
          },
        })

        processedUsers++
        this.logger.debug(`Processed expired credits for user ${userId}: ${totalBalance} cents`)
      }
      catch (error) {
        failedUsers++
        this.logger.error(`Failed to process expired credits for user ${userId}`, error)
      }
    }

    this.logger.debug(`Daily credits expiration check completed. Processed: ${processedUsers}, Failed: ${failedUsers}`)
  }
}
