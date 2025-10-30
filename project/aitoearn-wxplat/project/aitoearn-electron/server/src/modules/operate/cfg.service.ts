/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-03-03 18:41:40
 * @LastEditors: nevin
 * @Description: Cfg cfg
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { Cfg } from 'src/db/schema/cfg.schema';
import { ResponseUtil } from 'src/global/class/correctResponse.class';
import { TableUtil } from 'src/global/class/tableUtli.class';
import { TableDto } from 'src/global/dto/table.dto';
import { ONOFF } from 'src/global/enum/all.enum';

@Injectable()
export class CfgService {
  constructor(
    @InjectModel(Cfg.name)
    private readonly cfgModel: Model<Cfg>,
  ) {}

  // 创建或者更新
  async create(data: Partial<Cfg>) {
    const { key, ...restData } = data;
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };
    return await this.cfgModel.findOneAndUpdate(
      { key },
      { $set: restData },
      options,
    );
  }

  // 获取
  async getInfoById(id: string): Promise<Cfg> {
    const res = await this.cfgModel.findOne({ _id: id });
    return res;
  }

  // 获取
  async getInfoByKey(key: string): Promise<Cfg> {
    const res = await this.cfgModel.findOne({ key });
    return res;
  }

  /**
   * 获取列表
   * @param pageInfo
   * @returns
   */
  async getCfgList(pageInfo: TableDto) {
    const { skip, take } = TableUtil.GetSqlPaging(pageInfo);
    const filter: RootFilterQuery<Cfg> = {};
    const tatal = await this.cfgModel.countDocuments(filter);
    const data = await this.cfgModel
      .find(filter)
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(take);

    return ResponseUtil.GetCorrectResponse(
      pageInfo.pageNo,
      pageInfo.pageSize,
      tatal,
      data,
    );
  }

  // 更新信息
  async updateValue(id: string, data: any): Promise<boolean> {
    const res = await this.cfgModel.updateOne({ _id: id }, data);
    return res.modifiedCount > 0;
  }

  // 更新状态
  async updateStatus(id: string, status: ONOFF): Promise<boolean> {
    const res = await this.cfgModel.updateOne(
      { _id: id },
      { $set: { status } },
    );
    return res.modifiedCount > 0;
  }

  // 删除
  async del(key: string): Promise<boolean> {
    const res = await this.cfgModel.deleteMany({ key });
    return res.deletedCount > 0;
  }
}
