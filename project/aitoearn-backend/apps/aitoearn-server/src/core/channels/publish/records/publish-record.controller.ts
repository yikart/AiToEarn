import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, ParseObjectIdPipe } from '@yikart/common'
import { PublishRecordReadService } from './publish-record-read.service'
import { PublishRecordAccountQueryDto, PublishRecordListQueryDto, PublishRecordWorkLinkUpdateDto } from './publish-record.dto'
import { ChannelPublicPublishRecordVo, ChannelPublishRecordVo, ChannelPublishUserActionVo } from './publish-record.vo'

@ApiTags('Channels/Publish')
@Controller({ path: '/channels/publish/records', version: '2' })
export class PublishRecordController {
  constructor(private readonly recordReadService: PublishRecordReadService) {}

  @ApiDoc({
    summary: '获取发布历史',
    description: '分页获取用户发布历史记录',
    query: PublishRecordListQueryDto.schema,
    response: [ChannelPublishRecordVo],
  })
  @Get('/')
  async listRecords(
    @GetToken() token: TokenInfo,
    @Query() query: PublishRecordListQueryDto,
  ) {
    const records = await this.recordReadService.listByUserId(token.id, {
      accountId: query.accountId,
      accountType: query.accountType,
      status: query.status,
      time: query.time,
    })
    return records.map(record => ChannelPublishRecordVo.create(record))
  }

  @ApiDoc({
    summary: '获取排队中的任务',
    description: '获取用户排队中的发布任务',
    query: PublishRecordAccountQueryDto.schema,
    response: [ChannelPublishRecordVo],
  })
  @Get('/queued')
  async listQueued(
    @GetToken() token: TokenInfo,
    @Query() query: PublishRecordAccountQueryDto,
  ) {
    const records = await this.recordReadService.listQueued(token.id, {
      accountId: query.accountId,
      accountType: query.accountType,
      time: query.time,
    })
    return records.map(record => ChannelPublishRecordVo.create(record))
  }

  @ApiDoc({
    summary: '获取已发布的任务',
    description: '获取用户已发布的任务',
    query: PublishRecordAccountQueryDto.schema,
    response: [ChannelPublishRecordVo],
  })
  @Get('/published')
  async listPublished(
    @GetToken() token: TokenInfo,
    @Query() query: PublishRecordAccountQueryDto,
  ) {
    const records = await this.recordReadService.listPublished(token.id, {
      accountId: query.accountId,
      accountType: query.accountType,
      time: query.time,
    })
    return records.map(record => ChannelPublishRecordVo.create(record))
  }

  @ApiDoc({
    summary: '公开查询发布记录',
    description: '根据记录 ID 公开查询发布状态、作品链接等基础信息',
    response: ChannelPublicPublishRecordVo,
  })
  @Public()
  @Get('/public/:recordId')
  async getPublicRecord(
    @Param('recordId', ParseObjectIdPipe) recordId: string,
  ) {
    const record = await this.recordReadService.getPublicDetail(recordId)
    return ChannelPublicPublishRecordVo.create(record)
  }

  @ApiDoc({
    summary: '删除发布记录',
    description: '删除当前用户的终态本地发布记录，不删除平台作品',
  })
  @Delete('/:recordId')
  async deleteRecord(
    @GetToken() token: TokenInfo,
    @Param('recordId', ParseObjectIdPipe) recordId: string,
  ): Promise<void> {
    await this.recordReadService.deleteById(token.id, recordId)
  }

  @ApiDoc({
    summary: '更新发布记录作品链接状态',
    description: '更新当前用户发布记录的作品链接状态；ready 时会解析作品链接并同步作品 ID 等派生字段。',
    body: PublishRecordWorkLinkUpdateDto.schema,
    response: ChannelPublishRecordVo,
  })
  @Patch('/:recordId/work-link')
  async updateWorkLink(
    @GetToken() token: TokenInfo,
    @Param('recordId', ParseObjectIdPipe) recordId: string,
    @Body() body: PublishRecordWorkLinkUpdateDto,
  ) {
    const record = await this.recordReadService.updateWorkLink(token.id, recordId, body)
    return ChannelPublishRecordVo.create(record)
  }

  @ApiDoc({
    summary: '获取发布记录用户操作信息',
    description: '获取抖音等待用户操作发布记录的 App scheme 和短链接',
    response: ChannelPublishUserActionVo,
  })
  @Get('/:recordId/user-action')
  async getUserAction(
    @GetToken() token: TokenInfo,
    @Param('recordId', ParseObjectIdPipe) recordId: string,
  ) {
    return this.recordReadService.getUserAction(token.id, recordId)
  }

  @ApiDoc({
    summary: '获取发布记录详情',
    description: '根据记录 ID 获取发布记录详情',
    response: ChannelPublishRecordVo,
  })
  @Get('/:recordId')
  async getRecord(
    @GetToken() token: TokenInfo,
    @Param('recordId') recordId: string,
  ) {
    const record = await this.recordReadService.getDetail(recordId, token.id)
    return ChannelPublishRecordVo.create(record)
  }
}
