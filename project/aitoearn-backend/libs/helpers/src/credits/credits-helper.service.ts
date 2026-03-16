import { Injectable, Logger } from '@nestjs/common'
import { AppException, CreditsType, ResponseCode } from '@yikart/common'
import { CreditsBalanceRepository, CreditsRecord, CreditsRecordRepository, Transactional, UserRepository } from '@yikart/mongodb'
import { BigNumber } from 'bignumber.js'
import dayjs from 'dayjs'
import { AddCreditsDto, DeductCreditsDto } from './credits.dto'

@Injectable()
export class CreditsHelperService {
  private readonly logger = new Logger(CreditsHelperService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly creditsRecordRepository: CreditsRecordRepository,
    private readonly creditsBalanceRepository: CreditsBalanceRepository,
  ) { }

  /**
   * 获取用户Credits余额
   * @param userId 用户ID
   * @returns Credits余额（美分）
   */
  @Transactional()
  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }
    await this.checkUserCreditsExpiration(userId)
    return await this.creditsBalanceRepository.getBalance(userId)
  }

  /**
   * 增加Credits
   * @param data 添加Credits的数据
   */
  @Transactional()
  async addCredits(data: AddCreditsDto): Promise<void> {
    const { userId, amount, type, description, metadata, expiredAt } = data
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const amountBN = new BigNumber(amount)
    const balanceBN = amountBN

    await this.creditsRecordRepository.create({
      userId,
      amount: amountBN.toNumber(),
      balance: balanceBN.toNumber(),
      type,
      description,
      metadata,
      expiredAt: expiredAt ?? undefined,
    })

    await this.creditsBalanceRepository.increment(userId, amountBN.toNumber())
  }

  /**
   * 扣减Credits
   * @param data 扣减Credits的数据
   */
  @Transactional()
  async deductCredits(data: DeductCreditsDto): Promise<void> {
    const { userId, amount, type, description, metadata } = data
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    await this.checkUserCreditsExpiration(userId)

    const amountBN = new BigNumber(amount)

    const now = new Date()
    const soonExpiringThreshold = dayjs().add(7, 'day').toDate()
    const validRecords = await this.creditsRecordRepository.listValidCredits(userId)

    const expiring: CreditsRecord[] = []
    const permanent: CreditsRecord[] = []
    const other: CreditsRecord[] = []

    for (const record of validRecords) {
      if (!record.expiredAt) {
        permanent.push(record)
      }
      else if (record.expiredAt <= soonExpiringThreshold && record.expiredAt >= now) {
        expiring.push(record)
      }
      else if (record.expiredAt > soonExpiringThreshold) {
        other.push(record)
      }
    }

    let remainingAmountBN = amountBN
    const recordsToUpdate: Array<{ id: string, deductAmount: number }> = []

    for (const record of expiring) {
      if (remainingAmountBN.isLessThanOrEqualTo(0))
        break

      const availableBalanceBN = new BigNumber(record.balance)
      const deductAmountBN = BigNumber.minimum(remainingAmountBN, availableBalanceBN)
      recordsToUpdate.push({ id: record.id, deductAmount: deductAmountBN.toNumber() })
      remainingAmountBN = remainingAmountBN.minus(deductAmountBN)
    }

    if (remainingAmountBN.isGreaterThan(0)) {
      for (const record of permanent) {
        if (remainingAmountBN.isLessThanOrEqualTo(0))
          break

        const availableBalanceBN = new BigNumber(record.balance)
        const deductAmountBN = BigNumber.minimum(remainingAmountBN, availableBalanceBN)
        recordsToUpdate.push({ id: record.id, deductAmount: deductAmountBN.toNumber() })
        remainingAmountBN = remainingAmountBN.minus(deductAmountBN)
      }
    }

    if (remainingAmountBN.isGreaterThan(0)) {
      for (const record of other) {
        if (remainingAmountBN.isLessThanOrEqualTo(0))
          break

        const availableBalanceBN = new BigNumber(record.balance)
        const deductAmountBN = BigNumber.minimum(remainingAmountBN, availableBalanceBN)
        recordsToUpdate.push({ id: record.id, deductAmount: deductAmountBN.toNumber() })
        remainingAmountBN = remainingAmountBN.minus(deductAmountBN)
      }
    }

    for (const { id, deductAmount } of recordsToUpdate) {
      await this.creditsRecordRepository.updateById(id, {
        $inc: { balance: -deductAmount },
      })
    }

    await this.creditsRecordRepository.create({
      userId,
      amount: amountBN.negated().toNumber(),
      balance: 0,
      type,
      description,
      metadata,
    })

    await this.creditsBalanceRepository.decrement(userId, amountBN.toNumber())
  }

  /**
   * 检查并处理指定用户的过期 credits
   * @param userId 用户ID
   */
  @Transactional()
  private async checkUserCreditsExpiration(userId: string): Promise<void> {
    const expiredRecords = await this.creditsRecordRepository.listUserExpiredCredits(userId)

    if (expiredRecords.length === 0) {
      return
    }

    const totalExpiredBalanceBN = expiredRecords.reduce(
      (sum, record) => sum.plus(record.balance),
      new BigNumber(0),
    )
    const totalExpiredBalance = totalExpiredBalanceBN.toNumber()

    const recordIds = expiredRecords.map(r => r.id)
    await this.creditsRecordRepository.resetBalances(recordIds)

    await this.creditsRecordRepository.create({
      userId,
      amount: -totalExpiredBalance,
      balance: 0,
      type: CreditsType.Expired,
      description: 'Credits expired',
      metadata: {
        expiredRecords: expiredRecords.map(r => ({ id: r.id, amount: r.amount, balance: r.balance })),
      },
    })

    await this.creditsBalanceRepository.decrement(userId, totalExpiredBalance)

    this.logger.debug(`Processed expired credits for user ${userId}: ${totalExpiredBalance} cents`)
  }
}
