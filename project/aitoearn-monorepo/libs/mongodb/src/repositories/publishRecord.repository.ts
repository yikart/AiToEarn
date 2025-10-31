/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PublishRecord
 */
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { PublishStatus, PublishType } from '../enums'
import { PublishDayInfo, PublishInfo, PublishRecord } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class PublishRecordRepository extends BaseRepository<PublishRecord> {
  constructor(
    @InjectModel(PublishRecord.name)
    private readonly publishRecordModel: Model<PublishRecord>,
    @InjectModel(PublishInfo.name)
    private readonly publishInfoModel: Model<PublishInfo>,
    @InjectModel(PublishDayInfo.name)
    private readonly publishDayInfoModel: Model<PublishDayInfo>,
  ) {
    super(publishRecordModel)
  }

  /**
   * 创建
   * @param data
   * @returns
   */
  override async create(data: Partial<PublishRecord>) {
    const res = await this.publishRecordModel.create(data)
    return res
  }

  /**
   * 获取发布记录列表
   * @param query
   * @returns
   */
  async getPublishRecordList(
    query: {
      userId: string
      accountId?: string
      accountType?: AccountType
      status?: PublishStatus
      type?: PublishType
      time?: [Date, Date]
      uid?: string
    },
  ): Promise<PublishRecord[]> {
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
      ...(query.uid !== undefined && { uid: query.uid }),
    }
    const db = this.publishRecordModel.find(filters).sort({
      createdAt: -1,
    })
    const list = await db.exec()

    return list
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.publishRecordModel.findOne({ _id: id })
  }

  // 删除发布记录
  async deletePublishRecordById(id: string): Promise<boolean> {
    const res = await this.publishRecordModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  // 更新
  async updatePublishRecord(
    filter: RootFilterQuery<PublishRecord>,
    data: Partial<PublishRecord>,
  ) {
    const res = await this.publishRecordModel.updateOne(filter, { $set: data })
    return res.modifiedCount > 0
  }

  /**
   * 创建
   * @param data
   * @returns
   */
  async createPublishInfo(data: Partial<PublishInfo>) {
    const res = await this.publishInfoModel.create(data)
    return res
  }

  /**
   * change day publish info
   * if data had publish record, update it
   * @param data
   */
  async upDayPublishInfo(data: PublishRecord) {
    const today = new Date()
    this.publishDayInfoModel
      .findOneAndUpdate(
        {
          userId: data.userId,
          createdAt: {
            $gte: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
            ),
            $lt: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() + 1,
            ),
          },
        },
        {
          $inc: { publishTotal: 1 },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .exec()
  }

  /**
   * 获取发布每日信息列表
   * @param inFilter
   * @param pageInfo
   * @returns
   */
  async getPublishDayInfoList(
    inFilter: {
      userId: string
      time?: [Date, Date]
    },
    pageInfo: {
      pageNo: number
      pageSize: number
    },
  ) {
    const { pageNo, pageSize } = pageInfo
    const filter: RootFilterQuery<PublishDayInfo> = {
      userId: inFilter.userId,
      ...(inFilter.time && {
        createdAt: { $gte: inFilter.time[0], $lte: inFilter.time[1] },
      }),
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
  async findUserRecordInfo(userId: string) {
    // 1. 查询发放状态
    const recordInfo = await this.publishInfoModel.findOne({
      userId,
    })
    return recordInfo
  }

  // 获取发布信息数据
  async getPublishInfoData(userId: string) {
    const res = await this.publishInfoModel.findOne({ userId })
    return res
  }

  async updateUserPublishInfo(userId: string, data: Partial<PublishInfo>) {
    const res = await this.publishInfoModel.updateOne({ userId }, {
      $set: data,
    })
    return res
  }

  // 根据获取发布记录信息
  async getPublishRecordByDataId(accountType: AccountType, dataId: string) {
    const res = await this.publishInfoModel.findOne({ accountType, dataId })
    return res
  }

  async getPublishRecordDetail(data: {
    flowId: string
    userId: string
  }) {
    const publishRecord = await this.publishRecordModel.findOne({
      flowId: data.flowId,
      userId: data.userId,
    })
    return publishRecord
  }

  async getPublishRecordByTaskId(taskId: string, userId: string) {
    const res = await this.publishRecordModel
      .findOne({ taskId, userId })
      .sort({ createdAt: -1 })
    return res
  }

  async getPublishRecordByDataIdAndUid(uid: string, dataId: string) {
    const res = await this.publishRecordModel
      .findOne({ uid, dataId })
      .sort({ createdAt: -1 })
    return res
  }

  /**
   * 根据用户任务ID获取发布记录
   * @param userTaskId
   * @returns
   */
  async getPublishRecordToUserTask(userTaskId: string) {
    const res = await this.publishRecordModel
      .findOne({ userTaskId })
      .sort({ createdAt: -1 })
    return res
  }

  // 完成发布
  async donePublishRecord(
    filter: { dataId: string, uid: string },
    data: {
      workLink?: string
      dataOption?: unknown
    },
  ) {
    const res = await this.publishRecordModel.findOneAndUpdate(filter, { $set: data })
    return res
  }
}
