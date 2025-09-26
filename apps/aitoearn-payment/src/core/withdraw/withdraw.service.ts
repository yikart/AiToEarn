import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { WithdrawRecordRepository } from '@yikart/mongodb'
import { WithdrawCreateDto } from './withdraw.dto'

@Injectable()
export class WithdrawService {
  constructor(
    private readonly withdrawRecordRepository: WithdrawRecordRepository,
  ) {}

  async create(data: WithdrawCreateDto) {
    const res = await this.withdrawRecordRepository.create(data)
    return res
  }

  // 获取信息
  getInfoByIncomeId(incomeRecordId: string) {
    return this.withdrawRecordRepository.getByIncomeRecordId(incomeRecordId)
  }

  // 获取信息
  getInfoById(id: string) {
    return this.withdrawRecordRepository.getById(id)
  }

  async getListOfUser(page: TableDto, query: { userId: string }) {
    const { pageNo, pageSize } = page

    const [list, total] = await this.withdrawRecordRepository.listWithPagination({
      page: pageNo,
      pageSize,
      userId: query.userId,
    })

    return {
      list,
      total,
    }
  }
}
