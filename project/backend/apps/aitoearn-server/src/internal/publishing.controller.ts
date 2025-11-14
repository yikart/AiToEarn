import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { PublishingInternalService } from './provider/publishing.service'

@ApiTags('OpenSource/Internal/Publishing')
@Controller('internal')
@Internal()
export class PublishingController {
  constructor(private readonly publishingInternalService: PublishingInternalService) { }

  @ApiDoc({
    summary: 'Create Publish Record',
  })
  @Post('/publishing/records')
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
  @Get('/publishing/records/:recordId')
  async getPublishRecordInfo(
    @Param('recordId') recordId: string,
  ) {
    return await this.publishingInternalService.getPublishRecordInfo(
      recordId,
    )
  }

  @ApiDoc({
    summary: 'Update Publish Record Status',
  })
  @Patch('/publishing/records/:recordId/status')
  async updatePublishRecordStatus(
    @Param('recordId') recordId: string,
    @Body() body: { status: PublishStatus, errorMsg?: string },
  ) {
    return await this.publishingInternalService.updatePublishRecordStatus(
      recordId,
      body.status,
      body.errorMsg,
    )
  }

  @ApiDoc({
    summary: 'Get Publish Record by Data ID',
  })
  @Get('/:uid/publishing/records/:dataId')
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
  @Patch('/:uid/publishing/records/:dataId')
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
