/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PubRecord
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { PubRecord, PubStatus } from 'src/db/schema/pubRecord.schema';
import { TableDto } from 'src/global/dto/table.dto';
import { PubRecordListDto } from './dto/publish.dto';

@Injectable()
export class PublishService {
  constructor(
    @InjectModel(PubRecord.name)
    private readonly PubRecordModel: Model<PubRecord>,
  ) {}

  async createPubRecord(newData: Partial<PubRecord>) {
    // 获取当前最大的 id
    const maxRecord = await this.PubRecordModel.findOne().sort({ id: -1 });
    const newId = maxRecord ? maxRecord.id + 1 : 1;
    
    return await this.PubRecordModel.create({
      ...newData,
      id: newId,
    });
  }

  /**
   * 获取发布记录列表
   * @param userId
   * @param page
   * @returns
   */
  async getPubRecordList(
    userId: string,
    page: TableDto,
    query: PubRecordListDto,
  ): Promise<{
    list: PubRecord[];
    totalCount: number;
  }> {
    const filters: RootFilterQuery<PubRecord> = {
      userId,
      ...(query.type !== undefined && { type: query.type }),
      ...(query.time !== undefined &&
        query.time.length === 2 && {
          createdAt: { $gte: query.time[0], $lte: query.time[1] },
        }),
    };
    const list = await this.PubRecordModel.find(filters)
      .skip((page.pageNo - 1) * page.pageSize)
      .limit(page.pageSize)
      .sort({ createdAt: -1 });

    const totalCount = await this.PubRecordModel.countDocuments(filters);

    return {
      list,
      totalCount,
    };
  }

  /**
   * 获取发布记录列表
   * @param userId
   * @param page
   * @returns
   */
  async getPubRecordDraftsList(
    userId: string,
    page: TableDto,
    query: PubRecordListDto,
  ): Promise<{
    list: PubRecord[];
    totalCount: number;
  }> {
    const filters: RootFilterQuery<PubRecord> = {
      userId,
      status: PubStatus.UNPUBLISH,
      ...(query.type !== undefined && { type: query.type }),
      ...(query.time !== undefined &&
        query.time.length === 2 && {
          createdAt: { $gte: query.time[0], $lte: query.time[1] },
        }),
    };
    const list = await this.PubRecordModel.find(filters)
      .skip((page.pageNo - 1) * page.pageSize)
      .limit(page.pageSize)
      .sort({ createdAt: -1 });

    const totalCount = await this.PubRecordModel.countDocuments(filters);

    return {
      list,
      totalCount,
    };
  }

  // 获取发布记录信息
  async getPubRecordInfo(id: number) {
    return await this.PubRecordModel.findOne({ id });
  }

  // 更新发布记录的状态
  async updatePubRecordStatus(id: number, status: PubStatus): Promise<boolean> {
    const res = await this.PubRecordModel.updateOne({ id }, { status });
    return res.modifiedCount > 0;
  }

  // 删除发布记录
  async deletePubRecordById(id: number): Promise<boolean> {
    const res = await this.PubRecordModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
}
