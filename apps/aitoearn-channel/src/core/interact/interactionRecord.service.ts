import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TableDto } from '../../common/global/dto/table.dto'
import { InteractionRecord } from '../../libs/database/schema/interactionRecord.schema'
import { AccountType } from '../../transports/account/common'
import { AddInteractionRecordDto } from './dto/interactionRecord.dto'

@Injectable()
export class InteractionRecordService {
  constructor(
    @InjectModel(InteractionRecord.name)
    private readonly interactionRecordModel: Model<InteractionRecord>,
  ) {}

  async create(data: AddInteractionRecordDto): Promise<InteractionRecord> {
    const createdRecord = new this.interactionRecordModel(data)
    return createdRecord.save()
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
    const list = await this.interactionRecordModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(((page.pageNo || 1) - 1) * page.pageSize)
      .limit(page.pageSize)
      .exec()

    return {
      total: await this.interactionRecordModel.countDocuments(filter),
      list,
    }
  }

  // 删除
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.interactionRecordModel.deleteOne({ _id: id }).exec()
    return { deleted: result.deletedCount > 0 }
  }
}
