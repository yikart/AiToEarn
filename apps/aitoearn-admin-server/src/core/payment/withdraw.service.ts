import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { IncomeRecordRepository, IncomeStatus, IncomeType, WithdrawRecordRepository, WithdrawRecordStatus } from '@yikart/mongodb'

@Injectable()
export class WithdrawService {
  constructor(
    private readonly withdrawRecordRepository: WithdrawRecordRepository,
    private readonly incomeRecordRepository: IncomeRecordRepository,
  ) { }

  async release(id: string, data: { desc?: string, screenshotUrls?: string[], status: WithdrawRecordStatus }) {
    const withdrawInfo = await this.withdrawRecordRepository.getInfoById(id)
    if (!withdrawInfo)
      throw new AppException(1000, 'Withdraw record not found')
    if (withdrawInfo.status !== WithdrawRecordStatus.WAIT)
      throw new AppException(1000, 'Withdraw record status error')
    if (withdrawInfo.relId) {
      const incomeInfo = await this.incomeRecordRepository.getRecordInfo(withdrawInfo.relId)
      if (!incomeInfo)
        throw new AppException(1000, 'Income record not found')
      if (incomeInfo.status !== IncomeStatus.WAIT) {
        throw new AppException(1000, 'Income record status error')
      }
    }
    const res = await this.incomeRecordRepository.deduct({
      userId: withdrawInfo.userId,
      amount: withdrawInfo.amount,
      type: IncomeType.TaskWithdraw,
      description: data.desc,
      relId: id,
      metadata: {
        screenshotUrls: data.screenshotUrls,
        withdrawId: id,
      },
    })
    if (!res)
      throw new AppException(1000, 'Income deduct failed')
    return this.withdrawRecordRepository.release(id, data)
  }

  async getList(page: TableDto, filter: { userId?: string, status?: WithdrawRecordStatus }) {
    return this.withdrawRecordRepository.getList(page, filter)
  }
}
