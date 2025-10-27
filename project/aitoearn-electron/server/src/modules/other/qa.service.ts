/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-04-14 17:53:17
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { QaRecord } from 'src/db/schema/qaRecord.schema';
import { TableDto } from 'src/global/dto/table.dto';

@Injectable()
export class QaService {
  constructor(
    @InjectModel(QaRecord.name)
    private readonly qaRecordModel: Model<QaRecord>,
  ) {}

  async createQaRecord(newData: Partial<QaRecord>) {
    return await this.qaRecordModel.create(newData);
  }

  /**
   * 获取记录列表
   * @param userId
   * @param page
   * @returns
   */
  async getQaRecordList(
    page: TableDto,
    query: any,
  ): Promise<{
    list: QaRecord[];
    totalCount: number;
  }> {
    const filters: RootFilterQuery<QaRecord> = {
      ...(query.type !== undefined && { type: query.type }),
    };

    const list = await this.qaRecordModel
      .find(filters)
      .skip((page.pageNo - 1) * page.pageSize)
      .limit(page.pageSize)
      .sort({ sort: -1 });

    const totalCount = await this.qaRecordModel.countDocuments(filters);

    return {
      list,
      totalCount,
    };
  }
}
