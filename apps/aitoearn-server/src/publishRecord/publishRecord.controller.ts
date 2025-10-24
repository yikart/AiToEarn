/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { AccountType } from '@yikart/mongodb'
import { CreatePublishRecordDto, DonePublishRecordDto, GetPublishRecordDetailDto, PublishDayInfoListDto, PublishRecordIdDto, PublishRecordListFilterDto } from './dto/publish.dto'
import { PublishRecordService } from './publishRecord.service'

@Controller()
export class PublishRecordController {
  constructor(private readonly publishRecordService: PublishRecordService) {}

  // 创建发布记录
  // @NatsMessagePattern('publish.publishRecord.create')
  @Post('publish/publishRecord/create')
  async createPublishRecord(@Body() data: CreatePublishRecordDto) {
    const res = await this.publishRecordService.createPublishRecord(data)
    return res
  }

  // 删除发布记录
  // @NatsMessagePattern('publish.publishRecord.delete')
  @Post('publish/publishRecord/delete')
  async deletePublishRecord(@Body() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.deletePublishRecordById(
      data.id,
    )
    return res
  }

  // 获取发布记录信息
  // @NatsMessagePattern('publish.publishRecord.info')
  @Post('publish/publishRecord/info')
  async getPublishRecordInfo(@Body() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.getPublishRecordInfo(data.id)
    return res
  }

  // 获取发布记录列表
  // @NatsMessagePattern('publish.publishRecord.list')
  @Post('publish/publishRecord/list')
  async getPublishRecordList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishRecordService.getPublishRecordList(data)
    return res
  }

  // @NatsMessagePattern('publish.publishInfo.data')
  @Post('publish/publishInfo/data')
  async getPublishInfoData(@Body() data: { userId: string }) {
    const res = await this.publishRecordService.getPublishInfoData(data.userId)
    return res || {}
  }

  // @NatsMessagePattern('publish.publishRecord.infoByDataId')
  @Post('publish/publishRecord/infoByDataId')
  async getPublishRecordByDataId(@Body() data: { dataId: string, accountType: AccountType }) {
    const res = await this.publishRecordService.getPublishRecordByDataId(data.accountType, data.dataId)
    return res
  }

  // @NatsMessagePattern('publish.PublishDayInfo.list')
  @Post('publish/PublishDayInfo/list')
  async getPublishDayInfoList(@Body() data: PublishDayInfoListDto) {
    const res = await this.publishRecordService.getPublishDayInfoList(data.filters, data.page)
    return res
  }

  // @NatsMessagePattern('publish.publishRecord.detail')
  @Post('publish/publishRecord/detail')
  async getPublishRecordDetail(@Body() data: GetPublishRecordDetailDto) {
    const res = await this.publishRecordService.getPublishRecordDetail(data)
    if (!res) {
      throw new BadRequestException('publish record not found')
    }
    return res
  }

  // @NatsMessagePattern('publish.publishRecord.detail.byTaskId')
  @Post('publish/publishRecord/detail/byTaskId')
  async getPublishRecordDetailByTaskId(@Body() data: { taskId: string, userId: string }) {
    const res = await this.publishRecordService.getPublishRecordByTaskId(data.taskId, data.userId)
    if (!res) {
      throw new BadRequestException('publish record not found')
    }
    return res
  }

  // @NatsMessagePattern('channel.publishRecord.userTask')
  @Post('channel/publishRecord/userTask')
  async getPublishRecordToUserTask(@Body() data: { userTaskId: string }) {
    const res = await this.publishRecordService.getPublishRecordToUserTask(data.userTaskId)
    return res
  }

  // @NatsMessagePattern('publish.publishRecord.done')
  @Post('publish/publishRecord/done')
  async donePublishRecord(@Body() data: DonePublishRecordDto) {
    const res = await this.publishRecordService.donePublishRecord(data.filter, data.data)
    return res
  }
}
