/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PublishRecord
 */
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, TableDto } from '@yikart/common'
import { PublishRecord, PublishRecordRepository, PublishStatus, PublishType } from '@yikart/mongodb'
import { UpdateQuery } from 'mongoose'
import { MaterialService } from '../content/material.service'
import {
  GetPublishRecordDetailDto,
  PublishDayInfoListFiltersDto,
  PublishRecordListFilterDto,
} from './publish-record.dto'

@Injectable()
export class PublishRecordService {
  private readonly logger = new Logger(PublishRecordService.name)
  constructor(
    private readonly publishRecordRepository: PublishRecordRepository,
    private readonly materialService: MaterialService,
  ) { }

  /**
   * 更新素材使用次数
   * @param materialId 素材ID
   */
  private async increaseMaterialUseCount(materialId?: string) {
    if (!materialId)
      return
    try {
      await this.materialService.addUseCount(materialId)
    }
    catch (error) {
      this.logger.error(`Failed to increase material use count for ${materialId}: ${error}`)
    }
  }

  /**
   * 创建发布记录，若状态为已发布则触发发布完成副作用
   * @param data 发布记录数据
   * @returns 创建后的发布记录
   */
  async createPublishRecord(data: Partial<PublishRecord>) {
    const res = await this.publishRecordRepository.create(data)
    return res
  }

  /**
   * 发布完成后的副作用：任务处理、每日统计、Redis 事件
   * @param data 已完成的发布记录
   */
  private onPublishCompleted(data: PublishRecord) {
    // 处理任务
    this.doTaskProcess(data)
    // 增加素材使用次数
    this.increaseMaterialUseCount(data.materialId)
    // 更新每日发布信息
    this.upDayPublishInfo(data)
  }

  /**
   * 更新每日发布统计信息
   * @param data 发布记录数据
   */
  private async upDayPublishInfo(data: PublishRecord) {
    await this.publishRecordRepository.upDayPublishInfo(data)
  }

  /**
   * 获取发布记录列表
   * @param query 查询条件
   * @returns 发布记录列表
   */
  async getPublishRecordList(query: PublishRecordListFilterDto): Promise<PublishRecord[]> {
    const res = await this.publishRecordRepository.getPublishRecordList(query)
    return res
  }

  /**
   * 获取排队中的发布记录列表
   * @param query 查询条件
   * @returns 排队中的发布记录列表
   */
  async getQueuedPublishRecords(query: PublishRecordListFilterDto): Promise<PublishRecord[]> {
    const res = await this.publishRecordRepository.getQueuedPublishRecords(query)
    return res
  }

  /**
   * 获取发布记录详细信息
   * @param id 发布记录ID
   * @returns 发布记录信息
   */
  async getPublishRecordInfo(id: string) {
    return this.publishRecordRepository.getPublishRecordInfo(id)
  }

  /**
   * 根据ID删除发布记录
   * @param id 发布记录ID
   * @returns 是否删除成功
   */
  async deletePublishRecordById(id: string): Promise<boolean> {
    const res = await this.publishRecordRepository.deletePublishRecordById(id)
    return res
  }

  /**
   * 更新发布记录
   * @param filter 查询过滤条件
   * @param data 要更新的字段
   * @returns 更新结果
   */
  async updatePublishRecord(
    filter: any,
    data: Partial<PublishRecord>,
  ) {
    const res = await this.publishRecordRepository.updatePublishRecord(filter, data)
    return res
  }

  /**
   * 处理发布完成后的任务逻辑：触发任务追踪事件、自动删除或增加素材使用次数
   * @param data 发布记录数据
   */
  private async doTaskProcess(_data: Partial<PublishRecord>) {
    // Task module removed — no-op
  }

  /**
   * 获取每日发布信息列表（分页）
   * @param inFilter 过滤条件
   * @param pageInfo 分页参数
   * @returns 每日发布信息列表
   */
  async getPublishDayInfoList(
    inFilter: PublishDayInfoListFiltersDto,
    pageInfo: TableDto,
  ) {
    return this.publishRecordRepository.getPublishDayInfoList(
      inFilter,
      pageInfo,
    )
  }

  /**
   * 获取用户的发布信息概览数据
   * @param userId 用户ID
   * @returns 发布信息数据
   */
  async getPublishInfoData(userId: string) {
    const res = await this.publishRecordRepository.getPublishInfoData(userId)
    return res
  }

  /**
   * 根据平台类型和作品ID获取发布记录
   * @param accountType 平台类型
   * @param dataId 作品ID
   * @returns 发布记录
   */
  async getPublishRecordByDataId(accountType: AccountType, dataId: string) {
    const res = await this.publishRecordRepository.getPublishRecordByDataId(accountType, dataId)
    return res
  }

  /**
   * 获取发布记录详情（根据流水ID和用户ID）
   * @param data 包含流水ID和用户ID的查询条件
   * @returns 发布记录详情
   */
  async getPublishRecordDetail(data: GetPublishRecordDetailDto) {
    const publishRecord = await this.publishRecordRepository.getPublishRecordDetail({
      flowId: data.flowId,
      userId: data.userId,
    })
    return publishRecord
  }

  /**
   * 根据任务ID和用户ID获取发布记录
   * @param taskId 任务ID
   * @param userId 用户ID
   * @returns 发布记录
   */
  async getPublishRecordByTaskId(taskId: string, userId: string) {
    const res = await this.publishRecordRepository.getPublishRecordByTaskId(taskId, userId)
    return res
  }

  /**
   * 根据广告主推广任务ID获取发布记录列表（广告主用）
   * @param advertiserTaskId 广告主任务ID
   * @param query 查询条件（状态、平台类型、分页）
   * @returns 发布记录列表
   */
  async getPublishRecordListByAdvertiserTaskId(
    advertiserTaskId: string,
    query?: {
      status?: number
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ) {
    return this.publishRecordRepository.getPublishRecordListByAdvertiserTaskId(advertiserTaskId, query)
  }

  /**
   * 根据广告主推广任务ID获取发布统计数据（广告主用）
   * @param advertiserTaskId 广告主任务ID
   * @returns 发布统计数据
   */
  async getPublishStatisticsByAdvertiserTaskId(advertiserTaskId: string) {
    return this.publishRecordRepository.getPublishStatisticsByAdvertiserTaskId(advertiserTaskId)
  }

  /**
   * 根据用户UID和作品ID获取发布记录
   * @param uid 用户UID
   * @param dataId 作品ID
   * @returns 发布记录
   */
  async getPublishRecordByDataIdAndUid(uid: string, dataId: string) {
    const res = await this.publishRecordRepository.getPublishRecordByDataIdAndUid(uid, dataId)
    return res
  }

  /**
   * 根据用户任务ID获取发布记录
   * @param userTaskId 用户任务ID
   * @returns 发布记录
   */
  async getPublishRecordToUserTask(userTaskId: string) {
    const res = await this.publishRecordRepository.getPublishRecordToUserTask(userTaskId)
    return res
  }

  /**
   * 完成发布记录：根据作品ID和UID更新发布状态为已完成，并触发任务处理
   * @param filter 查询条件（作品ID和UID）
   * @param data 附加数据（作品链接、扩展数据）
   * @returns 是否完成成功
   */
  async donePublishRecord(
    filter: { dataId: string, uid: string },
    data: {
      workLink?: string
      dataOption?: unknown
    },
  ): Promise<boolean> {
    const res = await this.publishRecordRepository.donePublishRecord(filter, data)
    if (!res)
      return false
    this.doTaskProcess(res)
    return !!res
  }

  /**
   * 根据草稿箱ID获取发布记录列表（分页）
   * @param materialGroupId 草稿箱ID
   * @param query 查询条件（状态、平台类型、分页）
   * @returns 发布记录列表和总数
   */
  async getPublishRecordListByMaterialGroupId(
    materialGroupId: string,
    query?: {
      status?: number
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ) {
    return this.publishRecordRepository.getPublishRecordListByMaterialGroupId(materialGroupId, query)
  }

  // ===== 以下为发布流程代理方法 =====
  /**
   * 根据ID获取发布记录
   * @param id 发布记录ID
   * @returns 发布记录
   */
  async getById(id: string) {
    return this.publishRecordRepository.getById(id)
  }

  /**
   * 根据ID更新发布记录
   * @param id 发布记录ID
   * @param update MongoDB更新查询
   * @returns 更新结果
   */
  async updateById(id: string, update: UpdateQuery<PublishRecord>) {
    return this.publishRecordRepository.updateById(id, update)
  }

  /**
   * 根据流水ID获取发布记录
   * @param flowId 流水ID
   * @returns 发布记录
   */
  async getByFlowId(flowId: string) {
    return this.publishRecordRepository.findOneByFlowId(flowId)
  }

  /**
   * 根据ID获取单条发布记录
   * @param id 发布记录ID
   * @returns 发布记录
   */
  async getOneById(id: string) {
    return this.publishRecordRepository.findOneById(id)
  }

  /**
   * 根据作品ID和UID获取单条发布记录
   * @param dataId 作品ID
   * @param uid 用户UID
   * @returns 发布记录
   */
  async getOneByData(dataId: string, uid: string) {
    return this.publishRecordRepository.findOneByData(dataId, uid)
  }

  /**
   * 根据ID完成发布记录：更新状态为已发布
   * @param id 发布记录ID
   * @param dataId 平台返回的作品ID
   * @param data 附加数据（作品链接、扩展数据）
   * @returns 更新结果
   */
  async completeById(data: PublishRecord, dataId: string, newData?: { workLink: string, dataOption?: Record<string, any> }) {
    this.onPublishCompleted(data)
    return this.publishRecordRepository.complete(data.id, dataId, newData)
  }

  /**
   * 根据ID标记发布记录为失败状态
   * @param id 发布记录ID
   * @param errMsg 错误信息
   * @returns 更新结果
   */
  async failById(id: string, errMsg: string) {
    return this.publishRecordRepository.fail(id, errMsg)
  }

  /**
   * 根据ID更新发布记录状态
   * @param id 发布记录ID
   * @param status 目标状态
   * @param msg 附加消息（可选）
   * @returns 更新结果
   */
  async updateStatusById(id: string, status: PublishStatus, msg?: string) {
    return this.publishRecordRepository.updateStatus(id, status, msg)
  }

  /**
   * 更新发布记录的队列ID
   * @param id 发布记录ID
   * @param queueId 队列ID
   * @param queued 是否已入队（可选）
   * @returns 更新结果
   */
  async updateQueueId(id: string, queueId: string, queued?: boolean) {
    return this.publishRecordRepository.updateQueueId(id, queueId, queued)
  }

  /**
   * 根据ID删除发布记录（发布流程专用）
   * @param id 发布记录ID
   * @returns 删除结果
   */
  async deleteById(id: string) {
    return this.publishRecordRepository.delById(id)
  }

  /**
   * 获取指定时间之前的发布任务列表
   * @param end 截止时间
   * @returns 发布任务列表
   */
  async listByTime(end: Date) {
    return this.publishRecordRepository.getPublishTaskListByTime(end)
  }

  /**
   * 获取发布任务列表（支持多条件查询）
   * @param query 查询条件（用户ID、流水ID、账户ID、平台类型、状态、类型、时间范围、UID）
   * @returns 发布任务列表
   */
  async listPublishTasks(query: {
    userId: string
    flowId?: string
    accountId?: string
    accountType?: AccountType
    status?: PublishStatus
    type?: PublishType
    time?: [Date?, Date?, ...unknown[]]
    uid?: string
  }) {
    return this.publishRecordRepository.getPublishTasks(query)
  }

  /**
   * 获取排队中的发布任务列表
   * @param query 查询条件（用户ID、账户ID、平台类型、时间范围）
   * @returns 排队中的发布任务列表
   */
  async listQueuedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }) {
    return this.publishRecordRepository.getQueuedPublishTasks(query)
  }

  /**
   * 获取已发布的发布任务列表
   * @param query 查询条件（用户ID、账户ID、平台类型、时间范围）
   * @returns 已发布的任务列表
   */
  async listPublishedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }) {
    return this.publishRecordRepository.getPublishedPublishTasks(query)
  }

  /**
   * 根据流水ID获取发布任务列表
   * @param flowId 流水ID
   * @returns 发布任务列表
   */
  async listByFlowId(flowId: string) {
    return this.publishRecordRepository.getPublishTaskListByFlowId(flowId)
  }

  /**
   * 更新发布任务状态（含错误信息、发布时间、队列状态等）
   * @param id 任务ID
   * @param newData 要更新的状态数据
   * @returns 更新结果
   */
  async updateTaskStatus(
    id: string,
    newData: {
      errorMsg?: string
      status: PublishStatus
      publishTime?: Date
      queued?: boolean
      inQueue?: boolean
    },
  ) {
    return this.publishRecordRepository.updatePublishTaskStatus(id, newData)
  }

  /**
   * 将发布记录更新为发布中状态
   * @param id 发布记录ID
   * @param dataId 平台返回的作品ID
   * @param workLink 作品链接（可选）
   * @returns 更新结果
   */
  async updateAsPublishing(id: string, dataId: string, workLink?: string) {
    return this.publishRecordRepository.updateAsPublishing(id, dataId, workLink)
  }

  /**
   * 根据流水ID和用户ID获取发布任务详情
   * @param flowId 流水ID
   * @param userId 用户ID
   * @returns 发布任务详情
   */
  async getTaskInfoWithFlowId(flowId: string, userId: string) {
    return this.publishRecordRepository.getPublishTaskInfoWithFlowId(flowId, userId)
  }

  /**
   * 根据任务ID和用户ID获取发布任务详情
   * @param id 任务ID
   * @param userId 用户ID
   * @returns 发布任务详情
   */
  async getTaskInfoWithUserId(id: string, userId: string) {
    return this.publishRecordRepository.getPublishTaskInfoWithUserId(id, userId)
  }

  /**
   * 根据草稿箱ID获取已发布的记录列表（分页）
   * @param materialGroupId 草稿箱ID
   * @param query 查询条件（平台类型、分页）
   * @returns 已发布记录列表和总数
   */
  async listPublishedByMaterialGroupIdWithPagination(
    materialGroupId: string,
    query?: {
      accountType?: AccountType
      pageNo?: number
      pageSize?: number
    },
  ) {
    return this.publishRecordRepository.listPublishedByMaterialGroupIdWithPagination(materialGroupId, query)
  }
}
