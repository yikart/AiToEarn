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
import { PublishRecordSource, PublishStatus, PublishType } from '../enums'
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
      source: { $ne: PublishRecordSource.TASK_LINK },
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
    }).lean({ virtuals: true })
    const list = await db.exec()

    return list
  }

  async getQueuedPublishRecords(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date, Date]
  }): Promise<PublishRecord[]> {
    // status not equal published
    const filters: RootFilterQuery<PublishRecord> = {
      status: { $ne: PublishStatus.PUBLISHED },
      userId: query.userId,
      source: { $ne: PublishRecordSource.TASK_LINK },
    }
    if (query.accountId) {
      filters.accountId = query.accountId
    }
    if (query.accountType) {
      filters.accountType = query.accountType
    }
    if (query.time && query.time.length === 2) {
      filters.publishTime = { $gte: query.time[0], $lte: query.time[1] }
    }
    return this.publishRecordModel.find(filters).sort({
      createdAt: -1,
    }).lean({ virtuals: true })
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.publishRecordModel.findOne({ _id: id }).lean({ virtuals: true })
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
      .lean({ virtuals: true })
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
      .lean({ virtuals: true })

    return {
      total,
      list,
    }
  }

  // 发放发布奖励
  async getUserRecordInfo(userId: string) {
    // 1. 查询发放状态
    const recordInfo = await this.publishInfoModel.findOne({
      userId,
    }).lean({ virtuals: true })
    return recordInfo
  }

  // 获取发布信息数据
  async getPublishInfoData(userId: string) {
    const res = await this.publishInfoModel.findOne({ userId }).lean({ virtuals: true })
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
    const res = await this.publishInfoModel.findOne({ accountType, dataId }).lean({ virtuals: true })
    return res
  }

  async getPublishRecordDetail(data: {
    flowId: string
    userId: string
  }) {
    const publishRecord = await this.publishRecordModel.findOne({
      flowId: data.flowId,
      userId: data.userId,
    }).lean({ virtuals: true })
    return publishRecord
  }

  async getPublishRecordByTaskId(taskId: string, userId: string) {
    const res = await this.publishRecordModel
      .findOne({ taskId, userId })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
    return res
  }

  /**
   * 根据广告主推广任务ID获取发布记录列表（广告主用，不需要userId）
   * @param advertiserTaskId 广告主推广任务ID
   * @param query 查询条件
   * @returns 发布记录列表和总数
   */
  async getPublishRecordListByAdvertiserTaskId(
    advertiserTaskId: string,
    query?: {
      status?: PublishStatus
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ): Promise<{ records: PublishRecord[], total: number }> {
    const filters: RootFilterQuery<PublishRecord> = {
      taskId: advertiserTaskId,
      ...(query?.status !== undefined && { status: query.status }),
      ...(query?.accountType !== undefined && { accountType: query.accountType }),
    }

    const pageNo = query?.pageNo || 1
    const pageSize = query?.pageSize || 20

    const total = await this.publishRecordModel.countDocuments(filters)
    const records = await this.publishRecordModel
      .find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean({ virtuals: true })
      .exec()

    return { records, total }
  }

  /**
   * 根据广告主推广任务ID获取发布统计数据（广告主用）
   * @param advertiserTaskId 广告主推广任务ID
   * @returns 统计数据
   */
  async getPublishStatisticsByAdvertiserTaskId(advertiserTaskId: string): Promise<{
    total: number
    published: number
    publishing: number
    failed: number
  }> {
    const [total, published, publishing, failed] = await Promise.all([
      this.publishRecordModel.countDocuments({ taskId: advertiserTaskId }),
      this.publishRecordModel.countDocuments({ taskId: advertiserTaskId, status: PublishStatus.PUBLISHED }),
      this.publishRecordModel.countDocuments({ taskId: advertiserTaskId, status: PublishStatus.PUBLISHING }),
      this.publishRecordModel.countDocuments({ taskId: advertiserTaskId, status: PublishStatus.FAILED }),
    ])

    return { total, published, publishing, failed }
  }

  async getPublishRecordByDataIdAndUid(uid: string, dataId: string) {
    const res = await this.publishRecordModel
      .findOne({ uid, dataId })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
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
      .lean({ virtuals: true })
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
    const res = await this.publishRecordModel.findOneAndUpdate(filter, { $set: data }).lean({ virtuals: true })
    return res
  }

  async getActiveUserTotal(startDate: Date, endDate: Date): Promise<number> {
    const res = await this.publishRecordModel.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate },
    })
    return res.length
  }

  /**
   * 根据草稿箱ID获取发布记录列表
   * @param materialGroupId 草稿箱ID
   * @param query 查询条件
   * @returns 发布记录列表和总数
   */
  async getPublishRecordListByMaterialGroupId(
    materialGroupId: string,
    query?: {
      status?: PublishStatus
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ): Promise<{ records: PublishRecord[], total: number }> {
    const filters: RootFilterQuery<PublishRecord> = {
      materialGroupId,
      ...(query?.status !== undefined && { status: query.status }),
      ...(query?.accountType !== undefined && { accountType: query.accountType }),
    }

    const pageNo = query?.pageNo || 1
    const pageSize = query?.pageSize || 20

    const total = await this.publishRecordModel.countDocuments(filters)
    const records = await this.publishRecordModel
      .find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean({ virtuals: true })
      .exec()

    return { records, total }
  }

  /**
   * 根据素材组ID获取已发布的记录列表（用于统计数据融合）
   * 仅返回 status=PUBLISHED 且 dataId 非空的记录
   * @param materialGroupId 素材组ID
   * @param query 查询条件
   * @returns 发布记录列表和总数
   */
  async listPublishedByMaterialGroupIdWithPagination(
    materialGroupId: string,
    query?: {
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ): Promise<{ records: PublishRecord[], total: number }> {
    const filters: RootFilterQuery<PublishRecord> = {
      materialGroupId,
      status: PublishStatus.PUBLISHED,
      dataId: { $exists: true, $ne: '' },
      ...(query?.accountType !== undefined && { accountType: query.accountType }),
    }

    const pageNo = query?.pageNo || 1
    const pageSize = query?.pageSize || 20

    const total = await this.publishRecordModel.countDocuments(filters)
    const records = await this.publishRecordModel
      .find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean({ virtuals: true })
      .exec()

    return { records, total }
  }

  // ----- 迁移 ----
  async add(publishTask: Partial<PublishRecord>) {
    return await this.publishRecordModel.create(publishTask)
  }

  async updateQueueId(taskId: string, queueId: string, queued?: boolean) {
    return await this.publishRecordModel.updateOne({ id: taskId }, { queueId, inQueue: queued === undefined ? undefined : queued }).exec()
  }

  async findOneById(id: string) {
    return await this.publishRecordModel.findOne({ _id: id }).lean({ virtuals: true }).exec()
  }

  async findOneByFlowId(flowId: string) {
    return await this.publishRecordModel.findOne({ flowId }).lean({ virtuals: true }).exec()
  }

  async findOneByData(dataId: string, uid: string) {
    return await this.publishRecordModel.findOne({ dataId, uid }).lean({ virtuals: true }).exec()
  }

  async complete(id: string, dataId: string, data?: {
    workLink: string
    dataOption?: Record<string, any>
  }) {
    return await this.publishRecordModel.updateOne(
      { _id: id },
      {
        status: PublishStatus.PUBLISHED,
        errorMsg: '',
        dataId,
        workLink: data?.workLink,
        publishTime: new Date(),
        queued: false,
        inQueue: false,
      },
    ).exec()
  }

  async fail(id: string, errMsg: string) {
    return await this.publishRecordModel.updateOne(
      { _id: id },
      { status: PublishStatus.FAILED, errorMsg: errMsg },
    ).exec()
  }

  async updateStatus(id: string, status: PublishStatus, msg?: string) {
    return await this.publishRecordModel.updateOne(
      { _id: id },
      { $set: { status, errorMsg: msg } },
    ).exec()
  }

  async getPublishTaskListByTime(end: Date): Promise<PublishRecord[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      publishTime: { $lte: end },
      status: PublishStatus.WaitingForPublish,
    }
    const list = await this.publishRecordModel.find(filters).sort({
      publishTime: 1,
    }).lean({ virtuals: true })

    return list
  }

  async getPublishTasks(query: any): Promise<PublishRecord[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      userId: query.userId,
      source: { $ne: PublishRecordSource.TASK_LINK },
      ...(query.flowId !== undefined && { flowId: query.flowId }),
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
    }).lean({ virtuals: true })
    const list = await db.exec()

    return list
  }

  async getQueuedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishRecord[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      status: PublishStatus.WaitingForPublish,
      userId: query.userId,
      source: { $ne: PublishRecordSource.TASK_LINK },
    }
    if (query.accountId) {
      filters.accountId = query.accountId
    }
    if (query.accountType) {
      filters.accountType = query.accountType
    }
    if (query.time && query.time.length === 2) {
      filters.publishTime = { $gte: query.time[0], $lte: query.time[1] }
    }
    return this.publishRecordModel.find(filters).sort({
      createdAt: -1,
    }).lean({ virtuals: true })
  }

  async getPublishedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishRecord[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      status: PublishStatus.PUBLISHED,
      userId: query.userId,
      source: { $ne: PublishRecordSource.TASK_LINK },
    }
    if (query.accountId) {
      filters.accountId = query.accountId
    }
    if (query.accountType) {
      filters.accountType = query.accountType
    }
    if (query.time && query.time.length === 2) {
      filters.publishTime = { $gte: query.time[0], $lte: query.time[1] }
    }
    return this.publishRecordModel.find(filters).sort({
      createdAt: -1,
    }).lean({ virtuals: true })
  }

  async getPublishTaskListByFlowId(
    flowId: string,
  ): Promise<PublishRecord[]> {
    const filters: RootFilterQuery<PublishRecord> = {
      flowId,
    }
    const list = await this.publishRecordModel.find(filters).sort({
      publishTime: 1,
    }).lean({ virtuals: true })
    return list
  }

  async updatePublishTaskStatus(
    id: string,
    newData: {
      errorMsg?: string
      status: PublishStatus
      publishTime?: Date
      queued?: boolean
      inQueue?: boolean
    },
  ): Promise<boolean> {
    const res = await this.publishRecordModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

  async updateAsPublishing(id: string, dataId: string, workLink?: string): Promise<boolean> {
    const res = await this.publishRecordModel.updateOne(
      { _id: id },
      { $set: { status: PublishStatus.PUBLISHING, dataId, workLink, errorMsg: '', inQueue: false, queued: false } },
    ).exec()
    return res.modifiedCount > 0
  }

  async delById(id: string): Promise<boolean> {
    const res = await this.publishRecordModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  async getPublishTaskInfoWithFlowId(flowId: string, userId: string) {
    return await this.publishRecordModel.findOne({ flowId, userId }).lean({ virtuals: true }).exec()
  }

  async getPublishTaskInfoWithUserId(id: string, userId: string) {
    return await this.publishRecordModel.findOne({ _id: id, userId }).lean({ virtuals: true }).exec()
  }
}
