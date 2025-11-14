/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: wxgzh
 */
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { GetUserCumulateData } from './dto/wxGzh.dto'
import { WxGzhService } from './wxGzh.service'

@ApiTags('OpenSource/Platform/WeChat Official')
@Controller('plat/wxGzh')
export class WxGzhController {
  constructor(private readonly wxGzhService: WxGzhService) {}

  @ApiDoc({
    summary: 'Create WeChat Authorization Task',
  })
  @Get('auth/url/:type')
  async createAuthTask(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
  ) {
    const res = await this.wxGzhService.createAuthTask(token.id, type, spaceId || '')

    return {
      id: res.taskId,
      url: res.url,
    }
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Get('auth/create-account/:taskId')
  async getAuthTaskInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.wxGzhService.getAuthTaskInfo(taskId)
  }

  @ApiDoc({
    summary: 'Get Accumulated User Metrics',
    query: GetUserCumulateData.schema,
  })
  @Get('account/userCumulate')
  async getUserCumulate(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateData,
  ) {
    return this.wxGzhService.getUserCumulate(query.accountId, query.beginDate, query.endDate)
  }

  @ApiDoc({
    summary: 'Get Article Reading Metrics',
    query: GetUserCumulateData.schema,
  })
  @Get('account/userRead')
  async getUserRead(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateData,
  ) {
    return this.wxGzhService.getUserRead(query.accountId, query.beginDate, query.endDate)
  }
}
