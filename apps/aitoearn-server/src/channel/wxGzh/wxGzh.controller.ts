/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: wxgzh
 */
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { GetUserCumulateData } from './dto/wxGzh.dto'
import { WxGzhService } from './wxGzh.service'

@ApiTags('plat/wxGzh - 微信公众号')
@Controller('plat/wxGzh')
export class WxGzhController {
  constructor(private readonly wxGzhService: WxGzhService) {}

  @ApiOperation({ summary: '发起微信授权登陆' })
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

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Get('auth/create-account/:taskId')
  async getAuthTaskInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.wxGzhService.getAuthTaskInfo(taskId)
  }

  @ApiOperation({ summary: '获取累计用户数据' })
  @Get('account/userCumulate')
  async getUserCumulate(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateData,
  ) {
    return this.wxGzhService.getUserCumulate(query.accountId, query.beginDate, query.endDate)
  }

  @ApiOperation({ summary: '获取图文阅读概况数据' })
  @Get('account/userRead')
  async getUserRead(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateData,
  ) {
    return this.wxGzhService.getUserRead(query.accountId, query.beginDate, query.endDate)
  }
}
