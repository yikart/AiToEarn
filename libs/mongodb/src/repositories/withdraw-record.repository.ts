import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
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
}
