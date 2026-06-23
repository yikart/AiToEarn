import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AnalyticsService } from '../analytics/analytics.service'
import { ChannelWorkAnalyticsVo } from '../analytics/analytics.vo'
import { WorkService } from './work.service'
import {
  WorkAccountQueryDto,
  WorkAnalyticsQueryDto,
  WorkLinkInfoQueryDto,
  WorkListPlatformParamsDto,
  WorkListQueryDto,
  WorkOwnershipBodyDto,
  WorkPlatformParamsDto,
} from './works.dto'
import { ChannelWorkDataVo, ChannelWorkListVo, ChannelWorkOwnershipVo } from './works.vo'

@ApiTags('Channels/Works')
@Controller({ path: '/channels/works', version: '2' })
export class WorksController {
  constructor(
    private readonly workService: WorkService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @ApiDoc({
    summary: '解析作品链接',
    description: '根据链接获取作品信息',
    query: WorkLinkInfoQueryDto.schema,
    response: ChannelWorkDataVo,
  })
  @Get('/link-info')
  async getLinkInfo(
    @GetToken() token: TokenInfo,
    @Query() query: WorkLinkInfoQueryDto,
  ) {
    return ChannelWorkDataVo.create(
      await this.workService.getLinkInfo(
        token.id,
        query.platform,
        query.link,
        query.accountId,
      ),
    )
  }

  @ApiDoc({
    summary: '获取账号作品列表',
    description: '获取指定平台账号的作品列表',
    query: WorkListQueryDto.schema,
    response: ChannelWorkListVo,
  })
  @Get('/:platform')
  async listWorks(
    @GetToken() token: TokenInfo,
    @Param() params: WorkListPlatformParamsDto,
    @Query() query: WorkListQueryDto,
  ) {
    return ChannelWorkListVo.create(
      await this.workService.listWorks(
        token.id,
        params.platform,
        query.accountId,
        query.pagination,
      ),
    )
  }

  @ApiDoc({
    summary: '获取作品详情',
    description: '获取指定作品的详细信息',
    query: WorkAccountQueryDto.schema,
    response: ChannelWorkDataVo,
  })
  @Get('/:platform/:platformWorkId')
  async getDetail(
    @GetToken() token: TokenInfo,
    @Param() params: WorkPlatformParamsDto,
    @Query() query: WorkAccountQueryDto,
  ) {
    return ChannelWorkDataVo.create(
      await this.workService.getDetail(
        token.id,
        params.platform,
        params.platformWorkId,
        query.accountId,
      ),
    )
  }

  @ApiDoc({
    summary: '获取作品数据',
    description: '获取指定作品的分析数据',
    query: WorkAnalyticsQueryDto.schema,
    response: ChannelWorkAnalyticsVo,
  })
  @Get('/:platform/:platformWorkId/analytics')
  async getAnalytics(
    @GetToken() token: TokenInfo,
    @Param() params: WorkPlatformParamsDto,
    @Query() query: WorkAnalyticsQueryDto,
  ) {
    return ChannelWorkAnalyticsVo.create(
      await this.analyticsService.fetchWorkAnalytics(
        token.id,
        params.platform,
        params.platformWorkId,
        query.accountId,
        {
          since: query.since,
          until: query.until,
        },
      ),
    )
  }

  @ApiDoc({
    summary: '验证作品归属',
    description: '验证作品是否属于指定账号',
    body: WorkOwnershipBodyDto.schema,
    response: ChannelWorkOwnershipVo,
  })
  @Post('/:platform/:platformWorkId/ownership/verify')
  async verifyOwnership(
    @GetToken() token: TokenInfo,
    @Param() params: WorkPlatformParamsDto,
    @Body() body: WorkOwnershipBodyDto,
  ) {
    return ChannelWorkOwnershipVo.create(
      await this.workService.verifyOwnership(
        token.id,
        params.platform,
        params.platformWorkId,
        body.candidateAccountId,
      ),
    )
  }
}
