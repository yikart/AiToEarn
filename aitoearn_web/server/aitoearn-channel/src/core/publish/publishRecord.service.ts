/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PublishRecord
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema';
import { PublishTask } from '@/libs/database/schema/publishTask.schema';
import { AccountType } from '@/transports/account/common';
import { PublishRecordListFilterDto } from './dto/publish.dto';
import { BilibiliPubService } from './plat/bilibiliPub.service';
import { PublishBase } from './plat/publish.base';

@Injectable()
export class PublishRecordService {
  private readonly publishMap = new Map<AccountType, PublishBase>();

  constructor(
    @InjectModel(PublishRecord.name)
    private readonly publishRecordModel: Model<PublishRecord>,
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
    private readonly bilibiliPubService: BilibiliPubService,
  ) {
    this.publishMap.set(AccountType.BILIBILI, this.bilibiliPubService);
  }

  /**
   * 获取发布记录列表
   * @param query
   * @returns
   */
  async getPublishRecordList(
    query: PublishRecordListFilterDto,
  ): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      userId: query.userId,
      ...(query.accountId !== undefined && { accountId: query.accountId }),
      ...(query.accountType !== undefined && {
        accountType: query.accountType,
      }),
      ...(query.status !== undefined && {
        status: query.status,
      }),
      ...(query.type !== undefined && { type: query.type }),
      ...(query.time !== undefined
        && query.time.length === 2 && {
        publishTime: { $gte: query.time[0], $lte: query.time[1] },
      }),
    };
    const db1 = this.publishRecordModel.find(filters).sort({
      createdAt: -1,
    });
    const db2 = this.publishTaskModel.find(filters).sort({
      createdAt: -1,
    });
    const list1 = await db1.exec();
    const list2 = await db2.exec();

    return [...list1, ...list2];
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.publishRecordModel.findOne({ _id: id });
  }

  // 删除发布记录
  async deletePublishRecordById(id: string): Promise<boolean> {
    const res = await this.publishRecordModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // 更新
  async updatePublishRecord(
    filter: RootFilterQuery<PublishRecord>,
    data: Partial<PublishRecord>,
  ) {
    const res = await this.publishRecordModel.updateOne(filter, { $set: data });
    return res.modifiedCount > 0;
  }
}
