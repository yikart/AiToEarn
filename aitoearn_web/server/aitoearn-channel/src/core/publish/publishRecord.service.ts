/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PublishRecord
 */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Model, RootFilterQuery } from 'mongoose';
import { TableDto } from '@/common/global/dto/table.dto';
import { PublishDayInfo } from '@/libs/database/schema/publishDayInfo.schema';
import { PublishInfo } from '@/libs/database/schema/publishInfo.schema';
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema';
import { PublishTask } from '@/libs/database/schema/publishTask.schema';
import { PointsNatsApi } from '@/transports/user/points.natsApi';
import { PublishDayInfoListFiltersDto, PublishRecordListFilterDto } from './dto/publish.dto';

@Injectable()
export class PublishRecordService {
  constructor(
    @InjectModel(PublishRecord.name)
    private readonly publishRecordModel: Model<PublishRecord>,
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishInfo.name)
    private readonly publishInfoModel: Model<PublishInfo>,
    @InjectModel(PublishDayInfo.name)
    private readonly publishDayInfoModel: Model<PublishDayInfo>,
    private readonly pointsNatsApi: PointsNatsApi,
  ) {}

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

  // 创建
  @OnEvent('publishRecord.create', { async: true })
  async createPublishRecord(data: Partial<PublishRecord>) {
    const res = await this.publishRecordModel.create(data);
    // Conduct daily data release statistics
    this.upDayPublishInfo(res);
    this.grantPublishReward(res)
    return res;
  }

  private addPoints(userId: string, amount: number) {
    this.pointsNatsApi.addPoints({
      userId,
      amount,
      type: 'publish',
      description: '发布奖励',
      metadata: {},
    })
  }

  private getNeedPubPoints(days: number) {
    return days <= 7 ? 1 : days <= 21 ? 2 : 3;
  }

  /**
   * change day publish info
   * if data had publish record, update it
   * @param data
   */
  private async upDayPublishInfo(data: PublishRecord) {
    const today = new Date();
    this.publishDayInfoModel.findOneAndUpdate(
      {
        userId: data.userId,
        createdAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
      {
        $inc: { publishTotal: 1 },
      },
      {
        upsert: true,
        new: true,
      },
    ).exec();
  }

  /**
   * 获取发布每日信息列表
   * @param inFilter
   * @param pageInfo
   * @returns
   */
  async getPublishDayInfoList(inFilter: PublishDayInfoListFiltersDto, pageInfo: TableDto) {
    const { pageNo, pageSize } = pageInfo

    const filter: RootFilterQuery<PublishDayInfo> = {
      userId: inFilter.userId,
      ...(inFilter.time && { createAt: { $gte: inFilter.time[0], $lte: inFilter.time[1] } }),
    }

    const total = await this.publishDayInfoModel.countDocuments(filter)
    const list = await this.publishDayInfoModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNo! - 1) * pageSize)
      .limit(pageSize)
      .lean()

    return {
      total,
      list,
    }
  }

  // 发放发布奖励
  async grantPublishReward(data: PublishRecord) {
    // 1. 查询发放状态
    const recordInfo = await this.publishInfoModel.findOne({
      userId: data.userId,
    });
    // 2. 第一次发布
    if (!recordInfo) {
      this.addPoints(data.userId, 1)
      this.publishInfoModel.create({
        userId: data.userId,
        upInfoDate: new Date(),
        days: 1,
      });
      return
    }

    const { upInfoDate } = recordInfo;
    // 如果是今天，直接返回
    if (moment(upInfoDate).isSame(moment(), 'day')) {
      return
    }
    // 3. 判断upInfoDate时间是否是昨天
    const isYesterday = moment(upInfoDate).isSame(moment().subtract(1, 'day'), 'day');
    // 3.1 不是昨天
    if (!isYesterday) {
      this.addPoints(data.userId, 1)
      this.publishInfoModel.updateOne({
        userId: data.userId,
      }, {
        $set: { upInfoDate: new Date(), days: 1 },
      });
      return
    }

    // 3.2 是昨天
    const { days } = recordInfo;
    this.addPoints(data.userId, this.getNeedPubPoints(days + 1))
    this.publishInfoModel.updateOne({
      userId: data.userId,
    }, {
      $set: { upInfoDate: new Date(), days: days + 1 },
    });
  }

  // 获取发布信息数据
  async getPublishInfoData(userId: string) {
    const res = await this.publishInfoModel.findOne({ userId });
    return res;
  }
}
