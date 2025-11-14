/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc } from '@yikart/common'
import { CreatePublishRecordDto, DonePublishRecordDto, GetPublishRecordDetailDto, PublishDayInfoListDto, PublishRecordIdDto, PublishRecordListFilterDto } from '../publishRecord/dto/publish.dto'
import { PublishRecordService } from '../publishRecord/publishRecord.service'

@ApiTags('OpenSource/Internal/PublishRecord')
@Controller('internal')
@Internal()
export class PublishRecordController {
  constructor(private readonly publishRecordService: PublishRecordService) {}

  @ApiDoc({
    summary: 'Create Publish Record',
    body: CreatePublishRecordDto.schema,
  })
  @Post('publishRecord/create')
  async createPublishRecord(@Body() data: CreatePublishRecordDto) {
    const res = await this.publishRecordService.createPublishRecord(data)
    return res
  }

  @ApiDoc({
    summary: 'Delete Publish Record',
    body: PublishRecordIdDto.schema,
  })
  @Post('publishRecord/delete')
  async deletePublishRecord(@Body() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.deletePublishRecordById(
      data.id,
    )
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record Info',
    body: PublishRecordIdDto.schema,
  })
  @Post('publishRecord/info')
  async getPublishRecordInfo(@Body() data: PublishRecordIdDto) {
    const res = await this.publishRecordService.getPublishRecordInfo(data.id)
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record List',
    body: PublishRecordListFilterDto.schema,
  })
  @Post('publishRecord/list')
  async getPublishRecordList(@Body() data: PublishRecordListFilterDto) {
    const res = await this.publishRecordService.getPublishRecordList(data)
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Info Data',
  })
  @Post('publishInfo/data')
  async getPublishInfoData(@Body() data: { userId: string }) {
    const res = await this.publishRecordService.getPublishInfoData(data.userId)
    return res || {}
  }

  @ApiDoc({
    summary: 'Get Publish Record By Data ID',
  })
  @Post('publishRecord/infoByDataId')
  async getPublishRecordByDataId(@Body() data: { dataId: string, accountType: AccountType }) {
    const res = await this.publishRecordService.getPublishRecordByDataId(data.accountType, data.dataId)
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Day Info List',
    body: PublishDayInfoListDto.schema,
  })
  @Post('PublishDayInfo/list')
  async getPublishDayInfoList(@Body() data: PublishDayInfoListDto) {
    const res = await this.publishRecordService.getPublishDayInfoList(data.filters, data.page)
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record Detail',
    body: GetPublishRecordDetailDto.schema,
  })
  @Post('publishRecord/detail')
  async getPublishRecordDetail(@Body() data: GetPublishRecordDetailDto) {
    const res = await this.publishRecordService.getPublishRecordDetail(data)
    if (!res) {
      throw new BadRequestException('publish record not found')
    }
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record Detail By Task ID',
  })
  @Post('publishRecord/detail/byTaskId')
  async getPublishRecordDetailByTaskId(@Body() data: { taskId: string, userId: string }) {
    const res = await this.publishRecordService.getPublishRecordByTaskId(data.taskId, data.userId)
    if (!res) {
      throw new BadRequestException('publish record not found')
    }
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record To User Task',
  })
  @Post('publishRecord/userTask')
  async getPublishRecordToUserTask(@Body() data: { userTaskId: string }) {
    const res = await this.publishRecordService.getPublishRecordToUserTask(data.userTaskId)
    return res
  }

  @ApiDoc({
    summary: 'Done Publish Record',
    body: DonePublishRecordDto.schema,
  })
  @Post('publishRecord/done')
  async donePublishRecord(@Body() data: DonePublishRecordDto) {
    const res = await this.publishRecordService.donePublishRecord(data.filter, data.data)
    return res
  }
}
