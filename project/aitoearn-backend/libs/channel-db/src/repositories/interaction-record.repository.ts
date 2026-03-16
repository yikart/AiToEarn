import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType, TableDto } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { InteractionRecord } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class InteractionRecordRepository extends BaseRepository<InteractionRecord> {
  constructor(
    @InjectModel(InteractionRecord.name, DB_CONNECTION_NAME) private interactionRecordModel: Model<InteractionRecord>,
  ) {
    super(interactionRecordModel)
  }

  async add(data: Partial<InteractionRecord>): Promise<InteractionRecord> {
    const createdRecord = new this.interactionRecordModel(data)
    const saved = await createdRecord.save()
    return saved.toObject()
  }

  async getList(
    filters: {
      userId: string
      accountId?: string
      type?: AccountType
      worksId?: string
      time?: [Date?, Date?, ...unknown[]]
    },
    page: TableDto,
  ): Promise<{
    total: number
    list: InteractionRecord[]
  }> {
    const filter: RootFilterQuery<InteractionRecord> = {
      userId: filters.userId,
      ...(filters.time && filters.time.length === 2 && {
        createdAt: { $gte: filters.time[0], $lte: filters.time[1] },
      }),
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.worksId && { worksId: filters.worksId }),
    }

    const [list, total] = await Promise.all([
      this.interactionRecordModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(((page.pageNo || 1) - 1) * page.pageSize)
        .limit(page.pageSize)
        .lean({ virtuals: true })
        .exec(),
      this.interactionRecordModel.countDocuments(filter),
    ])

    return { total, list }
  }

  // 删除
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.interactionRecordModel.deleteOne({ _id: id }).exec()
    return { deleted: result.deletedCount > 0 }
  }
}
