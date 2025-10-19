import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model, PipelineStage, RootFilterQuery } from 'mongoose'
import { WithdrawRecord } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListWithdrawRecordParams extends Pagination {
  userId?: string
  status?: number
  amount?: number
  createdAt?: Date[]
}

export class WithdrawRecordRepository extends BaseRepository<WithdrawRecord> {
  constructor(
    @InjectModel(WithdrawRecord.name) withdrawRecordModel: Model<WithdrawRecord>,
  ) {
    super(withdrawRecordModel)
  }

  // 获取信息
  getInfoByIncomeId(incomeRecordId: string) {
    return this.model.findOne({ incomeRecordId })
  }

  async getListOfUser(page: {
    pageNo: number
    pageSize: number
  }, query: { userId: string }) {
    const { pageNo, pageSize } = page
    const filter: RootFilterQuery<WithdrawRecord> = {
      userId: query.userId,
    }

    const [list, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.model.countDocuments(filter),
    ])

    return {
      list,
      total,
    }
  }

  async listWithPagination(params: ListWithdrawRecordParams) {
    const { page, pageSize, userId, status, amount, createdAt } = params

    const filter: FilterQuery<WithdrawRecord> = {}
    if (userId)
      filter.userId = userId
    if (status !== undefined)
      filter.status = status
    if (amount !== undefined)
      filter.amount = amount
    if (createdAt) {
      filter.createdAt = {
        $gte: createdAt[0],
        $lte: createdAt[1],
      }
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async getByIncomeRecordId(incomeRecordId: string) {
    return await this.findOne({ incomeRecordId })
  }

  async listWithAggregation(pipeline: PipelineStage[]) {
    return await this.model.aggregate(pipeline).exec()
  }

  async countByFilter(filter: FilterQuery<WithdrawRecord>) {
    return await this.count(filter)
  }
}
