import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TableDto } from '@yikart/common'
import { WithdrawRecord } from '@yikart/mongodb'
import { Model, RootFilterQuery } from 'mongoose'
import { WithdrawCreateDto } from './withdraw.dto'

@Injectable()
export class WithdrawService {
  constructor(
    @InjectModel(WithdrawRecord.name) private withdrawRecordModel: Model<WithdrawRecord>,
  ) {}

  async create(data: WithdrawCreateDto) {
    const res = await this.withdrawRecordModel.create(data)
    return res
  }

  // 获取信息
  getInfoByIncomeId(incomeRecordId: string) {
    return this.withdrawRecordModel.findOne({ incomeRecordId })
  }

  // 获取信息
  getInfoById(id: string) {
    return this.withdrawRecordModel.findById(id)
  }

  async getListOfUser(page: TableDto, query: { userId: string }) {
    const { pageNo, pageSize } = page
    const filter: RootFilterQuery<WithdrawRecord> = {
      userId: query.userId,
    }

    const [list, total] = await Promise.all([
      this.withdrawRecordModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.withdrawRecordModel.countDocuments(filter),
    ])

    return {
      list,
      total,
    }
  }
}
