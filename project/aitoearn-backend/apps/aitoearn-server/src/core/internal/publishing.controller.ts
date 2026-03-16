import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { PublishRecord } from '@yikart/mongodb'
import { PublishingInternalService } from './provider/publishing.service'

@Controller()
@Internal()
export class PublishingController {
  constructor(private readonly publishingInternalService: PublishingInternalService) { }

  @ApiDoc({
    summary: 'Create Publish Record',
  })
  @Post('internal/publishing/records')
  async createPublishRecord(
    @Body() body: Partial<PublishRecord>,
  ) {
    return await this.publishingInternalService.createPublishRecord(
      body,
    )
  }

  @ApiDoc({
    summary: 'Get Publish Record Information',
  })
  @Get('internal/publishing/records/:recordId')
  async getPublishRecordInfo(
    @Param('recordId') recordId: string,
  ) {
    return await this.publishingInternalService.getPublishRecordInfo(
      recordId,
    )
  }

  @ApiDoc({
    summary: 'Get Publish Record by Data ID',
  })
  @Get('internal/:uid/publishing/records/:dataId')
  async getPublishRecordByDataId(
    @Param('uid') uid: string,
    @Param('dataId') dataId: string,
  ) {
    return await this.publishingInternalService.getPublishRecordByDataIdAndUid(
      uid,
      dataId,
    )
  }

  @ApiDoc({
    summary: 'Complete Publish Task',
  })
  @Patch('internal/:uid/publishing/records/:dataId')
  async completePublishTask(
    @Param('uid') uid: string,
    @Param('dataId') dataId: string,
    @Body() body: {
      workLink?: string
      dataOption?: unknown
    },
  ) {
    return await this.publishingInternalService.completePublishTask(
      { dataId, uid },
      body,
    )
  }
}
