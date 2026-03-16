import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType, TableDto } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { ReplyCommentRecord } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class ReplyCommentRecordRepository extends BaseRepository<ReplyCommentRecord> {
  constructor(
    @InjectModel(ReplyCommentRecord.name, DB_CONNECTION_NAME) private replyCommentRecordModel: Model<ReplyCommentRecord>,
  ) {
    super(replyCommentRecordModel)
  }

  async add(data: Partial<ReplyCommentRecord>): Promise<ReplyCommentRecord> {
    const createdRecord = new this.replyCommentRecordModel(data)
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
    list: ReplyCommentRecord[]
  }> {
    const filter: RootFilterQuery<ReplyCommentRecord> = {
      userId: filters.userId,
      ...(filters.time && filters.time.length === 2 && {
        createdAt: { $gte: filters.time[0], $lte: filters.time[1] },
      }),
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.worksId && { worksId: filters.worksId }),
    }

    const [list, total] = await Promise.all([
      this.replyCommentRecordModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(((page.pageNo || 1) - 1) * page.pageSize)
        .limit(page.pageSize)
        .lean({ virtuals: true })
        .exec(),
      this.replyCommentRecordModel.countDocuments(filter),
    ])

    return { total, list }
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.replyCommentRecordModel.deleteOne({ _id: id }).exec()
    return { deleted: result.deletedCount > 0 }
  }
}
