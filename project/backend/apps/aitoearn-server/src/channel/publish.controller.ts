/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { plainToInstance } from 'class-transformer'
import { PlatPublishNatsApi } from '../transports/channel/api/publish.natsApi'
import { PostHistoryItemVo, PublishRecordItemVo } from './dto/publish-response.vo'
import {
  CreatePublishDto,
  CreatePublishRecordDto,
  PublishDayInfoListFiltersDto,
  PubRecordListFilterDto,
  UpdatePublishRecordTimeDto,
} from './dto/publish.dto'
import { PublishService } from './publish.service'

@ApiTags('OpenSource/Channel/Publish')
@Controller('plat/publish')
export class PublishController {
  constructor(
    private readonly publishService: PublishService,
    private readonly platPublishNatsApi: PlatPublishNatsApi,
  ) {}

  @ApiDoc({
    summary: 'Create Publish Task',
    body: CreatePublishDto.schema,
  })
  @Post('create')
  async create(@GetToken() token: TokenInfo, @Body() data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data)
    return this.publishService.create(data)
  }

  @ApiDoc({
    summary: 'Create Publish Record',
    body: CreatePublishRecordDto.schema,
  })
  @Post('createRecord')
  async createRecord(@GetToken() token: TokenInfo, @Body() data: CreatePublishRecordDto) {
    data = plainToInstance(CreatePublishRecordDto, data)
    return this.publishService.createRecord({
      userId: token.id,
      ...data,
    })
  }

  @ApiDoc({
    summary: 'Get Publish Records',
    body: PubRecordListFilterDto.schema,
    response: [PublishRecordItemVo],
  })
  @Post('getList')
  async getList(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getList(data, token.id)
  }

  @ApiDoc({
    summary: 'Get Platform Post Records',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('posts')
  async getPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getPostHistory(data, token.id)
  }

  @ApiDoc({
    summary: 'Get Platform Queued Publish Tasks',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('/statuses/queued/posts')
  async getQueuedPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getQueuedPublishingTasks(data, token.id)
  }

  @ApiDoc({
    summary: 'Get Platform Published Posts',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('/statuses/published/posts')
  async getPublishedPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getPublishedPosts(data, token.id)
  }

  @ApiDoc({
    summary: 'Update Publish Task Time',
    body: UpdatePublishRecordTimeDto.schema,
  })
  @Post('updateTaskTime')
  async updatePublishRecordTime(
    @GetToken() token: TokenInfo,
    @Body() data: UpdatePublishRecordTimeDto,
  ) {
    return this.platPublishNatsApi.updatePublishRecordTime({
      publishTime: data.publishTime,
      userId: token.id,
      id: data.id,
    })
  }

  @ApiDoc({
    summary: 'Delete Pending Publish Task',
  })
  @Delete('delete/:id')
  async delete(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.platPublishNatsApi.deletePublishRecord({
      userId: token.id,
      id,
    })
  }

  @ApiDoc({
    summary: 'Publish Task Immediately',
  })
  @Post('nowPubTask/:id')
  async nowPubTask(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.platPublishNatsApi.nowPubTask(id)
  }

  @ApiDoc({
    summary: 'Get Publish Information Summary',
  })
  @Get('publishInfo/data')
  async publishInfoData(@GetToken() token: TokenInfo) {
    return this.publishService.publishInfoData(token.id)
  }

  @ApiDoc({
    summary: 'Get Daily Publish Information List',
    query: PublishDayInfoListFiltersDto.schema,
  })
  @Get('publishDayInfo/list/:pageNo/:pageSize')
  async publishDataInfoList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: PublishDayInfoListFiltersDto,
  ) {
    return this.publishService.publishDataInfoList(token.id, query, param)
  }

  @ApiDoc({
    summary: 'Get Publish Record Detail',
  })
  @Get('records/:flowId')
  async getPublishRecordDetail(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return this.publishService.getPublishRecordDetail(flowId, token.id)
  }
}
