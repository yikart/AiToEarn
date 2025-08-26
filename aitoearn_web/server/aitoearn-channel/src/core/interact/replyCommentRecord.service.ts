import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { TableDto } from '@/common/global/dto/table.dto';
import { ReplyCommentRecord } from '@/libs/database/schema/replyCommentRecord.schema';
import { AddReplyCommentRecordDto } from './dto/replyCommentRecord.dto';

@Injectable()
export class ReplyCommentRecordService {
  constructor(
    @InjectModel(ReplyCommentRecord.name)
    private readonly replyCommentRecordModel: Model<ReplyCommentRecord>,
  ) {}

  async create(data: AddReplyCommentRecordDto): Promise<ReplyCommentRecord> {
    const createdRecord = new this.replyCommentRecordModel(data);
    return createdRecord.save();
  }

  async getList(
    filters: {
      userId: string;
      accountId?: string;
      type?: string;
      worksId?: string;
      time?: [Date, Date];
    },
    page: TableDto,
  ): Promise<{
    total: number;
    list: ReplyCommentRecord[];
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
    const list = await this.replyCommentRecordModel
      .find(filter)
      .skip(((page.pageNo || 1) - 1) * page.pageSize)
      .limit(page.pageSize)
      .exec();

    return {
      total: await this.replyCommentRecordModel.countDocuments(filter),
      list,
    };
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    const result = await this.replyCommentRecordModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0
  }
}
