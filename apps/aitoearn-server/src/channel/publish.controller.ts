/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { plainToInstance } from 'class-transformer'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { PlatPublishNatsApi } from './api/publish.natsApi'
import { PostHistoryItemDto, PublishRecordItemDto } from './dto/publish-response.dto'
import {
  CreatePublishDto,
  CreatePublishRecordDto,
  PublishDayInfoListFiltersDto,
  PubRecordListFilterDto,
  UpdatePublishRecordTimeDto,
} from './dto/publish.dto'
import { PublishService } from './publish.service'

@ApiTags('plat/publish - 平台发布')
@Controller('plat/publish')
export class PublishController {
  constructor(
    private readonly publishService: PublishService,
    private readonly platPublishNatsApi: PlatPublishNatsApi,
  ) {}

  @ApiOperation({ summary: '创建发布' })
  @Post('create')
  async create(@GetToken() token: TokenInfo, @Body() data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data)
    return this.publishService.create(data)
  }

  @ApiOperation({ summary: '立即执行发布任务（测试用）' })
  @Get('run/:id')
  async run(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.publishService.run(id)
  }

  @ApiOperation({ summary: '创建发布记录' })
  @Post('createRecord')
  async createRecord(@GetToken() token: TokenInfo, @Body() data: CreatePublishRecordDto) {
    data = plainToInstance(CreatePublishRecordDto, data)
    return this.publishService.createRecord({
      userId: token.id,
      ...data,
    })
  }

  @ApiOperation({ summary: '获取发布记录' })
  @Post('getList')
  @ApiOkResponse({
    type: PublishRecordItemDto,
    isArray: true,
    description: '返回发布记录列表',
  })
  async getList(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getList(data, token.id)
  }

  @ApiOperation({ summary: '获取平台作品记录' })
  @Post('posts')
  @ApiOkResponse({
    type: PostHistoryItemDto,
    isArray: true,
    description: '返回发布记录列表',
  })
  async getPosts(
    @GetToken() token: TokenInfo,
    @Body() data: PubRecordListFilterDto,
  ) {
    return this.publishService.getPostHistory(data, token.id)
  }

  @ApiOperation({ summary: '修改发布任务时间' })
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

  @ApiOperation({
    summary: '删除发布任务，注意，只能删除未发布的任务，不能删除已经发布的记录',
  })
  @Delete('delete/:id')
  async delete(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.platPublishNatsApi.deletePublishRecord({
      userId: token.id,
      id,
    })
  }

  @ApiOperation({
    summary: '立即发布任务（在n天之后的任务想要立即发布）',
  })
  @Post('nowPubTask/:id')
  async nowPubTask(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.platPublishNatsApi.nowPubTask(id)
  }

  @ApiOperation({ summary: '获取发布信息数据' })
  @Get('publishInfo/data')
  async publishInfoData(@GetToken() token: TokenInfo) {
    return this.publishService.publishInfoData(token.id)
  }

  @ApiOperation({ summary: '获取每天发布信息数据列表' })
  @Get('publishDayInfo/list/:pageNo/:pageSize')
  async publishDataInfoList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: PublishDayInfoListFiltersDto,
  ) {
    return this.publishService.publishDataInfoList(token.id, query, param)
  }

  @ApiOperation({ summary: '获取发布记录详情' })
  @Get('records/:flowId')
  async getPublishRecordDetail(@GetToken() token: TokenInfo, @Param('flowId') flowId: string) {
    return this.publishService.getPublishRecordDetail(flowId, token.id)
  }
}
