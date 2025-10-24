/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: PublishRecord
 */
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { TableDto } from '@yikart/common'
import { AccountType, PublishRecord, PublishRecordRepository, PublishStatus } from '@yikart/mongodb'
import dayjs from 'dayjs'
import { MaterialService } from '../content/material.service'
import { TaskNatsApi } from '../transports/task/api/task.natsApi'
import { UserTaskNatsApi } from '../transports/task/api/user-task.natsApi'
import { PointsService } from '../user/points.service'
import {
  GetPublishRecordDetailDto,
  PublishDayInfoListFiltersDto,
  PublishRecordListFilterDto,
} from './dto/publish.dto'

@Injectable()
export class PublishRecordService {
  constructor(
    private readonly publishRecordRepository: PublishRecordRepository,
    private readonly materialService: MaterialService,
    private readonly userTaskNatsApi: UserTaskNatsApi,
    private readonly taskNatsApi: TaskNatsApi,
    private eventEmitter: EventEmitter2,
    private readonly pointsService: PointsService,
  ) { }

  /**
   * 创建
   * @param data
   * @returns
   */
  async createPublishRecord(data: Partial<PublishRecord>) {
    const res = await this.publishRecordRepository.create(data)
    if (data.dataId && data.accountType && data.uid && data.taskId) {
      this.doTaskProcess(res)
    }
    this.upDayPublishInfo(res)
    this.grantPublishReward(res)
    return res
  }

  /**
   * 获取发布记录列表
   * @param query
   * @returns
   */
  async getPublishRecordList(query: PublishRecordListFilterDto): Promise<PublishRecord[]> {
    const res = await this.publishRecordRepository.getPublishRecordList(query)
    return res
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.publishRecordRepository.getPublishRecordInfo(id)
  }

  // 删除发布记录
  async deletePublishRecordById(id: string): Promise<boolean> {
    const res = await this.publishRecordRepository.deletePublishRecordById(id)
    return res
  }

  // 更新
  async updatePublishRecord(
    filter: any,
    data: Partial<PublishRecord>,
  ) {
    const res = await this.publishRecordRepository.updatePublishRecord(filter, data)
    return res
  }

  /**
   * task process
   * @param data
   * @returns
   */
  private async doTaskProcess(data: Partial<PublishRecord>) {
    if (!data.userTaskId || !data.userId)
      return

    const userTask = await this.userTaskNatsApi.getUserTaskInfo(
      data.userTaskId,
    )

    if (!userTask)
      return

    data.taskId = userTask.taskId
    // 触发任务追踪事件
    if (data.accountType && data.uid && data.dataId) {
      this.eventEmitter.emit(
        'statistics.task.userTaskPosts',
        {
          accountId: data.accountId!,
          taskId: data.taskId,
          type: data.accountType,
          uid: data.uid!,
          postId: data.dataId,
        },
      )
    }
    const taskInfo = await this.taskNatsApi.getTaskInfo(userTask.taskId)

    const taskMaterialId = userTask.taskMaterialId || data.taskMaterialId
    // 删除草稿
    if (taskInfo && taskMaterialId) {
      if (taskInfo.autoDeleteMaterial) {
        this.materialService.del(taskMaterialId)
      }
      else {
        this.materialService.addUseCount(taskMaterialId)
      }
    }
  }

  private addPoints(userId: string, amount: number) {
    this.pointsService.addPoints({
      userId,
      amount,
      type: 'publish',
      description: '发布奖励',
      metadata: {},
    })
  }

  private getNeedPubPoints(days: number) {
    return days <= 7 ? 1 : days <= 21 ? 2 : 3
  }

  /**
   * change day publish info
   * if data had publish record, update it
   * @param data
   */
  private async upDayPublishInfo(data: PublishRecord) {
    await this.publishRecordRepository.upDayPublishInfo(data)
  }

  /**
   * 获取发布每日信息列表
   * @param inFilter
   * @param pageInfo
   * @returns
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

  // 发放发布奖励
  async grantPublishReward(data: PublishRecord) {
    // 1. 查询发放状态
    const recordInfo = await this.publishRecordRepository.findUserRecordInfo(data.userId)
    // 2. 第一次发布
    if (!recordInfo) {
      this.addPoints(data.userId, 1)
      this.publishRecordRepository.createPublishInfo({
        userId: data.userId,
        upInfoDate: new Date(),
        days: 1,
      })
      return
    }

    const { upInfoDate } = recordInfo
    // 如果是今天，直接返回
    if (dayjs(upInfoDate).isSame(dayjs(), 'day')) {
      return
    }
    // 3. 判断upInfoDate时间是否是昨天
    const isYesterday = dayjs(upInfoDate).isSame(
      dayjs().subtract(1, 'day'),
      'day',
    )
    // 3.1 不是昨天
    if (!isYesterday) {
      this.addPoints(data.userId, 1)
      await this.publishRecordRepository.updateUserPublishInfo(
        data.userId,
        { upInfoDate: new Date(), days: 1 },
      )
      return
    }

    // 3.2 是昨天
    const { days } = recordInfo
    this.addPoints(data.userId, this.getNeedPubPoints(days + 1))
    const newDays = days + 1
    await this.publishRecordRepository.updateUserPublishInfo(
      data.userId,
      { upInfoDate: new Date(), days: newDays },
    )
  }

  // 获取发布信息数据
  async getPublishInfoData(userId: string) {
    const res = await this.publishRecordRepository.getPublishInfoData(userId)
    return res
  }

  // 根据获取发布记录信息
  async getPublishRecordByDataId(accountType: AccountType, dataId: string) {
    const res = await this.publishRecordRepository.getPublishRecordByDataId(accountType, dataId)
    return res
  }

  async getPublishRecordDetail(data: GetPublishRecordDetailDto) {
    const publishRecord = await this.publishRecordRepository.getPublishRecordDetail({
      flowId: data.flowId,
      userId: data.userId,
    })
    return publishRecord
  }

  async getPublishRecordByTaskId(taskId: string, userId: string) {
    const res = await this.publishRecordRepository.getPublishRecordByTaskId(taskId, userId)
    return res
  }

  /**
   * 根据用户任务ID获取发布记录
   * @param userTaskId
   * @returns
   */
  async getPublishRecordToUserTask(userTaskId: string) {
    const res = await this.publishRecordRepository.getPublishRecordToUserTask(userTaskId)
    return res
  }

  // 完成发布
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

  async updatePublishRecordStatus(id: string, status: PublishStatus, errorMsg?: string) {
    const res = await this.publishRecordRepository.updatePublishRecord(
      { _id: id },
      { status, errorMsg },
    )
    return res
  }
}
