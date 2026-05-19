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
import { PublishRecordLinkStatus, PublishType } from '@yikart/mongodb'
import { PlatformService } from '../channel/platforms/platforms.service'
import { DonePublishRecordDto, GetPublishRecordDetailDto, PublishDayInfoListDto, PublishRecordIdDto, PublishRecordListFilterDto, UpdatePublishRecordWorkLinkDto } from '../publish-record/publish-record.dto'
import { PublishRecordService } from '../publish-record/publish-record.service'

@ApiTags('Internal/PublishRecord')
@Controller('internal')
@Internal()
export class PublishRecordController {
  constructor(
    private readonly publishRecordService: PublishRecordService,
    private readonly platformService: PlatformService,
  ) {}

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
    summary: 'Update Publish Record Work Link',
    description: '根据发布记录ID更新作品链接状态；ready 且有 workLink 时同步由作品链接派生的 dataId、uniqueId、type 等字段。',
    body: UpdatePublishRecordWorkLinkDto.schema,
  })
  @Post('publishRecord/workLink/update')
  async updatePublishRecordWorkLink(@Body() data: UpdatePublishRecordWorkLinkDto) {
    const publishRecord = await this.publishRecordService.getPublishRecordInfo(data.id)
    if (!publishRecord) {
      throw new BadRequestException('publish record not found')
    }
    if (!publishRecord.accountType) {
      throw new BadRequestException('publish record accountType is missing')
    }

    const linkStatus = data.linkStatus || PublishRecordLinkStatus.READY

    if (linkStatus !== PublishRecordLinkStatus.READY) {
      const res = await this.publishRecordService.updateWorkLinkById(data.id, {
        dataId: data.dataId,
        platformWorkId: data.platformWorkId,
        linkStatus,
        linkError: data.linkError,
        linkMeta: data.linkMeta,
      })
      if (!res) {
        throw new BadRequestException('publish record update failed')
      }
      return res
    }

    if (!data.workLink) {
      throw new BadRequestException('work link is required when linkStatus is ready')
    }

    const workLinkInfo = await this.platformService.getWorkLinkInfo(
      publishRecord.accountType,
      data.workLink,
      data.platformWorkId || data.dataId,
      publishRecord.accountId,
    )
    if (!workLinkInfo?.dataId || !workLinkInfo.uniqueId) {
      throw new BadRequestException('invalid work link')
    }

    const res = await this.publishRecordService.updateWorkLinkById(data.id, {
      workLink: workLinkInfo.resolvedUrl || data.workLink,
      originalWorkLink: workLinkInfo.originalWorkLink ?? null,
      dataId: workLinkInfo.dataId,
      uniqueId: workLinkInfo.uniqueId,
      platformWorkId: data.platformWorkId,
      workStatus: workLinkInfo.workStatus ?? null,
      linkStatus,
      linkError: data.linkError,
      linkMeta: data.linkMeta,
      type: Object.values(PublishType).includes(workLinkInfo.type as PublishType)
        ? (workLinkInfo.type as PublishType)
        : undefined,
    })
    if (!res) {
      throw new BadRequestException('publish record update failed')
    }
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
    summary: 'Done Publish Record',
    body: DonePublishRecordDto.schema,
  })
  @Post('publishRecord/done')
  async donePublishRecord(@Body() data: DonePublishRecordDto) {
    const res = await this.publishRecordService.donePublishRecord(data.filter, data.data)
    return res
  }

  @ApiDoc({
    summary: 'Get Publish Record List By Material Group ID',
  })
  @Post('publishRecord/list/byMaterialGroupId')
  async getPublishRecordListByMaterialGroupId(@Body() data: {
    materialGroupId: string
    status?: number
    accountType?: AccountType
    pageNo?: number
    pageSize?: number
  }) {
    return this.publishRecordService.getPublishRecordListByMaterialGroupId(data.materialGroupId, {
      status: data.status,
      accountType: data.accountType,
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    })
  }
}
