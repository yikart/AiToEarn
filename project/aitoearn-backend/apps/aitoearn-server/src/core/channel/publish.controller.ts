/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { plainToInstance } from 'class-transformer'
import { PublishRecordService } from '../publish-record/publish-record.service'
import { RelayClientService } from '../relay/relay-client.service'
import { ChannelAccountService } from './platforms/channel-account.service'
import { PostHistoryItemVo, PublishRecordItemVo } from './publish-response.vo'
import {
  CreatePublishDto,
  CreatePublishRecordDto,
  PublishDayInfoListFiltersDto,
  PubRecordListFilterDto,
  UpdatePublishRecordTimeDto,
  UpdatePublishTaskDto,
} from './publish.dto'
import { PublishService } from './publish.service'
import { PublishingService } from './publishing/publishing.service'

@ApiTags('渠道/发布')
@Controller('plat/publish')
export class PublishController {
  private readonly logger = new Logger(PublishController.name)

  constructor(
    private readonly publishService: PublishService,
    private readonly publishingService: PublishingService,
    private readonly publishRecordService: PublishRecordService,
    private readonly channelAccountService: ChannelAccountService,
    private readonly relayClientService: RelayClientService,
  ) { }

  @ApiDoc({
    summary: '公共发布创建',
    body: CreatePublishDto.schema,
  })
  @Public()
  @Post('pubCreate')
  async pubcCreate(@Body() data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data)
    return this.publishService.pubCreate(data)
  }

  @ApiDoc({
    summary: '创建发布任务',
    body: CreatePublishDto.schema,
  })
  @Post('create')
  async create(@GetToken() token: TokenInfo, @Body() data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data)
    return this.publishService.create(token.id, data)
  }

  @ApiDoc({
    summary: '创建发布记录',
    body: CreatePublishRecordDto.schema,
  })
  @Post('createRecord')
  async createRecord(@GetToken() token: TokenInfo, @Body() data: CreatePublishRecordDto) {
    data = plainToInstance(CreatePublishRecordDto, data)

    const res = await this.publishRecordService.createPublishRecord({
      userId: token.id,
      ...data,
    })

    // 如果发布状态是已经完成
    if (data.status === PublishStatus.PUBLISHED) {
      this.publishRecordService.completeById(res.id, data.dataId, { workLink: data.workLink || '' })
    }
    return res
  }

  @ApiDoc({
    summary: '获取发布记录列表',
    body: PubRecordListFilterDto.schema,
    response: [PublishRecordItemVo],
  })
  @Post('getList')
  async getList(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    const local = await this.publishService.getList(data, token.id)
    const relay = await this.fetchRelayData<PublishRecordItemVo[]>(token.id, '/plat/publish/getList', data)
    return [...local, ...relay]
  }

  @ApiDoc({
    summary: '获取平台发布历史',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('posts')
  async getPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    const local = await this.publishService.getPostHistory(data, token.id)
    const relay = await this.fetchRelayData<PostHistoryItemVo[]>(token.id, '/plat/publish/posts', data)
    return [...local, ...relay]
  }

  @ApiDoc({
    summary: '获取待发布任务列表',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('/statuses/queued/posts')
  async getQueuedPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    const local = await this.publishService.getQueuedPublishingTasks(data, token.id)
    const relay = await this.fetchRelayData<PostHistoryItemVo[]>(token.id, '/plat/publish/statuses/queued/posts', data)
    return [...local, ...relay]
  }

  @ApiDoc({
    summary: '获取已发布作品列表',
    body: PubRecordListFilterDto.schema,
    response: [PostHistoryItemVo],
  })
  @Post('/statuses/published/posts')
  async getPublishedPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    const local = await this.publishService.getPublishedPosts(data, token.id)
    const relay = await this.fetchRelayData<PostHistoryItemVo[]>(token.id, '/plat/publish/statuses/published/posts', data)
    return [...local, ...relay]
  }

  @ApiDoc({
    summary: '更新发布任务时间',
    body: UpdatePublishRecordTimeDto.schema,
  })
  @Post('updateTaskTime')
  async updatePublishRecordTime(
    @GetToken() token: TokenInfo,
    @Body() data: UpdatePublishRecordTimeDto,
  ) {
    return this.publishingService.updatePublishTaskTime(data.id, data.publishTime, token.id)
  }

  @ApiDoc({
    summary: '删除待发布任务',
  })
  @Delete('delete/:id')
  async delete(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.publishingService.deletePublishTaskById(id, token.id)
  }

  @ApiDoc({
    summary: '立即发布任务',
  })
  @Post('nowPubTask/:id')
  async nowPubTask(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.publishingService.publishTaskImmediately(id)
  }

  @ApiDoc({
    summary: '获取发布信息概览',
  })
  @Get('publishInfo/data')
  async publishInfoData(@GetToken() token: TokenInfo) {
    return this.publishService.publishInfoData(token.id)
  }

  @ApiDoc({
    summary: '获取每日发布信息列表',
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
    summary: '根据流水ID获取发布任务列表',
  })
  @Get('task/:flowId')
  async getPublishTaskListOfFlowId(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return this.publishService.getPublishTaskListOfFlowId(flowId, token.id)
  }

  @ApiDoc({
    summary: '获取发布记录详情',
  })
  @Get('records/:flowId')
  async getPublishRecordDetail(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return this.publishService.getPublishRecordDetail(flowId, token.id)
  }

  @ApiDoc({
    summary: '更新发布任务',
    body: UpdatePublishTaskDto.schema,
  })
  @Post('updateTask')
  async updatePublishTask(@GetToken() token: TokenInfo, @Body() data: UpdatePublishTaskDto) {
    return this.publishService.updatePublishTask(data, token.id)
  }

  private async fetchRelayData<T extends unknown[]>(userId: string, path: string, data: PubRecordListFilterDto): Promise<T> {
    if (!this.relayClientService.enabled) {
      return [] as unknown as T
    }
    try {
      const relayAccounts = await this.channelAccountService.listRelayAccountsByUserId(userId)
      if (relayAccounts.length === 0) {
        return [] as unknown as T
      }
      return await this.relayClientService.post<T>(path, {
        ...data,
        accountIds: relayAccounts.map(a => a.relayAccountRef),
      })
    }
    catch (error) {
      this.logger.error(`Fetch relay publish records failed: ${error}`)
      return [] as unknown as T
    }
  }
}
