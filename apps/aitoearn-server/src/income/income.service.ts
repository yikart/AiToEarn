import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { IncomeRecordRepository, IncomeStatus, IncomeType, WithdrawRecordType } from '@yikart/mongodb'
import { WithdrawService } from './withdraw.service'

const getWithdrawRecordTypeMap = new Map<IncomeType, WithdrawRecordType>([
  [IncomeType.Task, WithdrawRecordType.Task],
])

@Injectable()
export class IncomeService {
  constructor(
    private readonly withdrawService: WithdrawService,
    private readonly incomeRecordRepository: IncomeRecordRepository,
  ) { }

  /**
   * 获取收入信息
   * @param id
   * @returns
   */
  async getInfo(id: string) {
    const res = await this.incomeRecordRepository.getById(id)
    return res
  }

  /**
   * 收入列表
   * @param page
   * @param filter
   * @param filter.userId
   * @param filter.type
   * @returns
   */
  async getList(
    page: TableDto,
    filter: { userId: string, type?: IncomeType },
  ) {
    const res = await this.incomeRecordRepository.listWithPagination({
      ...filter,
      page: page.pageNo,
      pageSize: page.pageSize,
    })
    return res
  }

  /**
   * 创建提现
   * @param id
   * @param userWalletAccountId
   * @param flowId
   * @returns
   */
  async withdraw(id: string, userWalletAccountId?: string, flowId?: string) {
    const incomeInfo = await this.incomeRecordRepository.getById(id)
    if (!incomeInfo) {
      throw new AppException(10001, 'No income information was found')
    }
    if (incomeInfo.status !== IncomeStatus.WAIT) {
      throw new AppException(10001, 'Income information is not available')
    }
    const type = getWithdrawRecordTypeMap.get(incomeInfo.type) || WithdrawRecordType.Task
    const res = await this.withdrawService.create(incomeInfo.userId, {
      flowId,
      userWalletAccountId,
      type,
      amount: incomeInfo.amount,
      relId: incomeInfo.relId,
      incomeRecordId: incomeInfo.id,
      remark: incomeInfo.desc,
      metadata: {
        incomeRecordId: incomeInfo.id,
      },
    })
    this.incomeRecordRepository.withdraw(id, res.id)
    return res
  }

  /**
   * 提现全部收入
   * @param userId
   * @param userWalletAccountId
   * @returns
   */
  async withdrawAll(userId: string, userWalletAccountId: string) {
    const res = await this.withdrawService.createAll(userId, userWalletAccountId)
    return res
  }
}
