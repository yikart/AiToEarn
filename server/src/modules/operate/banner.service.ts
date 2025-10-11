/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2025-03-03 18:41:40
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { Banner } from 'src/db/schema/banner.schema';
import { ResponseUtil } from 'src/global/class/correctResponse.class';
import { TableUtil } from 'src/global/class/tableUtli.class';
import { TableDto } from 'src/global/dto/table.dto';
import { ONOFF } from 'src/global/enum/all.enum';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<Banner>,
  ) {}

  // 创建
  async create(data: Banner) {
    return await this.bannerModel.create(data);
  }

  // 获取
  async getBannerInfo(id: string): Promise<Banner> {
    const res = await this.bannerModel.findOne({ _id: id });
    return res;
  }

  /**
   * 获取列表
   * @param pageInfo
   * @param query
   * @returns
   */
  async getBannerList(pageInfo: TableDto, query: any) {
    const { skip, take } = TableUtil.GetSqlPaging(pageInfo);
    const filter: RootFilterQuery<Banner> = {
      ...(query.createTimeArray && {
        createTime: {
          $gte: query.createTimeArray[0],
          $lte: query.createTimeArray[1],
        },
      }),
    };
    const tatal = await this.bannerModel.countDocuments(filter);
    const data = await this.bannerModel
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

  /**
   * 获取全部
   * @param tag
   * @returns
   */
  async getBannerAll(tag?: string) {
    const filter: RootFilterQuery<Banner> = {
      ...(tag && {
        tag,
      }),
    };
    const data = await this.bannerModel.find(filter).sort({ createTime: -1 });
    return data;
  }

  // 更新信息
  async updateBannerInfo(id: string, data: Banner): Promise<boolean> {
    const res = await this.bannerModel.updateOne({ _id: id }, data);
    return res.modifiedCount > 0;
  }

  // 更新发布状态
  async updateBannerPublish(id: string, isPublish: ONOFF): Promise<boolean> {
    const res = await this.bannerModel.updateOne(
      { _id: id },
      { $set: { isPublish } },
    );
    return res.modifiedCount > 0;
  }

  // 删除
  async deleteBanner(id: string): Promise<boolean> {
    const res = await this.bannerModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
