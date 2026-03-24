import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { WxGzhService } from './wx-gzh.service'
import { GetUserCumulateDataDto } from './wx-plat.dto'
import { WxPlatService } from './wx-plat.service'

@ApiTags('Platform/WeChat Official')
@Controller('plat/wxGzh')
export class WxGzhController {
  constructor(
    private readonly wxPlatService: WxPlatService,
    private readonly wxGzhService: WxGzhService,
  ) {}

  @ApiDoc({
    summary: 'Create WeChat Authorization Task',
  })
  @Get('/auth/url/:type')
  async createAuthTask(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    const res = await this.wxPlatService.createAuthTask(
      { userId: token.id, type, spaceId: spaceId || '', callbackUrl, callbackMethod },
    )

    return {
      id: res.taskId,
      url: res.url,
    }
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Get('/auth/create-account/:taskId')
  async getAuthTaskInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.wxPlatService.getAuthTaskInfo(taskId)
  }

  @ApiDoc({
    summary: 'Get Accumulated User Metrics',
    query: GetUserCumulateDataDto.schema,
  })
  @Get('/account/userCumulate')
  async getUserCumulate(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateDataDto,
  ) {
    return this.wxGzhService.getusercumulate(query.accountId, query.beginDate, query.endDate)
  }

  @ApiDoc({
    summary: 'Get Article Reading Metrics',
    query: GetUserCumulateDataDto.schema,
  })
  @Get('/account/userRead')
  async getUserRead(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserCumulateDataDto,
  ) {
    return this.wxGzhService.getuserread(query.accountId, query.beginDate, query.endDate)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Accumulated User Metrics (Crawler)',
    body: GetUserCumulateDataDto.schema,
  })
  @Post('/getUserCumulate')
  async getCrawlerUserCumulate(@Body() data: GetUserCumulateDataDto) {
    return this.wxGzhService.getusercumulate(data.accountId, data.beginDate, data.endDate)
  }
}
