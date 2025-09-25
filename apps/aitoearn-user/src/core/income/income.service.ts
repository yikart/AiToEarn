import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { IncomeRecord, IncomeRecordRepository, IncomeRecordStatus, Transactional, UserRepository } from '@yikart/mongodb'
import { AddIncomeDto, DeductIncomeDto } from './income.dto'

@Injectable()
export class IncomeService {
  private readonly logger = new Logger(IncomeService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly incomeRecordRepository: IncomeRecordRepository,
  ) {}

  /**
   * 增加收入
   * @param data
   */
  @Transactional()
  async add(data: AddIncomeDto): Promise<void> {
    const userInfo = await this.userRepository.getById(data.userId)
    if (!userInfo)
      throw new AppException(ResponseCode.UserNotFound)

    await this.userRepository.updateById(data.userId, {
      $inc: { income: data.amount, totalIncome: data.amount },
    })

    await this.incomeRecordRepository.create(data)
  }

  /**
   * 扣减
   * @param data 扣减
   */
  @Transactional()
  async deduct(data: DeductIncomeDto): Promise<void> {
    const { userId, amount } = data

    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    if (user.income < amount) {
      throw new AppException(ResponseCode.UserInsufficientBalance, 'Insufficient balance')
    }

    await this.userRepository.updateById(userId, {
      $inc: { income: -amount },
    })

    await this.incomeRecordRepository.create({
      ...data,
      amount: -amount,
      status: IncomeRecordStatus.Processing,
    })
  }

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
    return user.income || 0
  }

  /**
   * 获取记录信息
   * @param id 记录ID
   * @returns 收入记录
   */
  async getRecordInfo(id: string): Promise<IncomeRecord | null> {
    return await this.incomeRecordRepository.getById(id)
  }

  /**
   * 获取记录列表
   * @param page
   * @param filter
   * @returns 记录列表
   */
  async getRecordList(page: TableDto, filter: { userId: string }) {
    const [list, total] = await this.incomeRecordRepository.listWithPagination({
      page: page.pageNo,
      pageSize: page.pageSize,
      userId: filter.userId,
    })

    return {
      list,
      total,
    }
  }

  // 提现
  async withdraw(id: string, withdrawId?: string) {
    await this.incomeRecordRepository.updateById(id, {
      status: IncomeRecordStatus.Processing,
      withdrawId,
    })
  }
}
