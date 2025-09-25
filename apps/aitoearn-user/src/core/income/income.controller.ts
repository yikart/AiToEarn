import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { AppException, NatsMessagePattern, ResponseCode } from '@yikart/common'
import { AddIncomeDto, DeductIncomeDto, IncomeBalanceDto, IncomeRecordListDto } from './income.dto'
import { IncomeService } from './income.service'

@Controller()
export class IncomeController {
  private readonly logger = new Logger(IncomeController.name)

  constructor(private readonly incomeService: IncomeService) {}

  /**
   * 获取记录信息
   */
  @NatsMessagePattern('user.incomeRecord.info')
  async getIncomeRecordInfo(@Payload() data: { id: string }) {
    const info = await this.incomeService.getRecordInfo(data.id)
    return info
  }

  /**
   * 增加收入
   */
  @NatsMessagePattern('user.income.add')
  async addPoints(@Payload() data: AddIncomeDto) {
    await this.incomeService.add(data)
    return true
  }

  /**
   * 扣减
   */
  @NatsMessagePattern('user.income.deduct')
  async deductPoints(@Payload() data: DeductIncomeDto) {
    await this.incomeService.deduct(data)
    return true
  }

  /**
   * 获取用户余额
   */
  @NatsMessagePattern('user.income.balance')
  async getBalance(@Payload() data: IncomeBalanceDto) {
    const balance = await this.incomeService.getBalance(data.userId)
    return balance
  }

  /**
   * 获取记录列表
   */
  @NatsMessagePattern('user.incomeRecord.list')
  async getRecords(@Payload() data: IncomeRecordListDto) {
    const res = await this.incomeService.getRecordList(data.page, data.filter)
    return res
  }

  // 提现
  @NatsMessagePattern('user.incomeRecord.withdraw')
  async withdraw(@Payload() data: { id: string, withdrawId?: string }) {
    const incomeInfo = await this.incomeService.getRecordInfo(data.id)
    if (!incomeInfo)
      throw new AppException(ResponseCode.IncomeRecordNotFound, 'There is no income record')
    if (incomeInfo.amount <= 0)
      throw new AppException(ResponseCode.IncomeRecordNotWithdrawable, 'Only income can be withdrawn')
    await this.incomeService.withdraw(data.id, data.withdrawId)
    return true
  }
}
