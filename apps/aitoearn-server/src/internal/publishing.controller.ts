import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountType, PublishRecord, PublishStatus } from '@yikart/mongodb'
import { PublishingInternalService } from './provider/publishing.service'

@ApiTags('内部服务接口')
@Controller('internal')
export class PublishingController {
  constructor(private readonly publishingInternalService: PublishingInternalService) { }

  @ApiOperation({ summary: 'create publish record' })
  @Post('/publishing/records')
  async createPublishRecord(
    @Body() body: Partial<PublishRecord>,
  ) {
    return await this.publishingInternalService.createPublishRecord(
      body,
    )
  }

  @ApiOperation({ summary: 'get publish record info' })
  @Get('/publishing/records/:recordId')
  async getPublishRecordInfo(
    @Param('recordId') recordId: string,
  ) {
    return await this.publishingInternalService.getPublishRecordInfo(
      recordId,
    )
  }

  @ApiOperation({ summary: 'update publish record status' })
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

  @ApiOperation({ summary: 'get publish record by dataId' })
  @Get('/:uid/publishing/records/:dataId')
  async getPublishRecordByDataId(
    @Param('uid') uid: string,
    @Param('dataId') dataId: string,
  ) {
    return await this.publishingInternalService.getPublishRecordByDataId(
      uid as unknown as AccountType,
      dataId,
    )
  }

  @ApiOperation({ summary: 'complete publish task' })
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
