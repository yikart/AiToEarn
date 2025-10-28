import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { IncomeRecordRepository, WithdrawRecordRepository, WithdrawRecordType } from '@yikart/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { UserWalletAccountService } from '../user/userWalletAccount.service'

@Injectable()
export class WithdrawService {
  constructor(
    private readonly withdrawRecordRepository: WithdrawRecordRepository,
    private readonly incomeRecordRepository: IncomeRecordRepository,
    private readonly userWalletAccountService: UserWalletAccountService,
  ) { }

  async create(userId: string, data: {
    flowId?: string
    userWalletAccountId?: string
    type: WithdrawRecordType
    amount: number
    relId?: string
    incomeRecordId?: string
    remark?: string
    metadata?: Record<string, unknown>
  }) {
    return this.withdrawRecordRepository.create({ userId, ...data })
  }

  async createAll(userId: string, userWalletAccountId: string) {
    const incomeRecordList = await this.incomeRecordRepository.getAllWithdrawableIncome(userId)
    if (!incomeRecordList?.length)
      return true

    const userWalletAccount = await this.userWalletAccountService.info(userWalletAccountId)
    if (!userWalletAccount)
      throw new AppException(1000, 'The Wallet Account Not Found')

    const flowId = uuidv4()

    for (const incomeRecord of incomeRecordList) {
      const oldData = await this.withdrawRecordRepository.getInfoByIncomeId(incomeRecord.id)
      if (oldData)
        continue

      const incomeInfo = await this.incomeRecordRepository.getRecordInfo(incomeRecord.id)
      if (!incomeInfo)
        continue

      this.withdrawRecordRepository.create({
        flowId,
        userId,
        relId: incomeInfo.relId,
        userWalletAccountId,
        userWalletAccountInfo: userWalletAccount,
        amount: incomeInfo.amount,
        incomeRecordId: incomeRecord.id,
        type: WithdrawRecordType.Task,
      }).then((withdrawRecord) => {
        this.incomeRecordRepository.withdraw(incomeRecord.id, withdrawRecord.id)
      })
    }

    return true
  }

  async getInfo(id: string) {
    return this.withdrawRecordRepository.getById(id)
  }

  async getList(page: TableDto, filter: { userId: string }) {
    return this.withdrawRecordRepository.getListOfUser(page, filter)
  }
}
