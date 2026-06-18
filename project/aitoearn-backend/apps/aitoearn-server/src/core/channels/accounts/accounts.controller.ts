import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AnalyticsService } from '../analytics/analytics.service'
import { ChannelAccountAnalyticsVo } from '../analytics/analytics.vo'
import { PublishOptionCreateBodyDto, PublishOptionValuesQueryDto } from '../platforms/platforms.dto'
import { PlatformsService } from '../platforms/platforms.service'
import { PublishOptionCreatedValueVo, PublishOptionValuesVo } from '../platforms/platforms.vo'
import {
  ChannelAccountAnalyticsQueryDto,
  ChannelAccountCreateDto,
  ChannelAccountDeleteQueryDto,
  ChannelAccountListQueryDto,
} from './account.dto'
import { AccountService } from './account.service'
import {
  ChannelAccountAuthStatusVo,
  ChannelAccountListVo,
  ChannelAccountVo,
} from './account.vo'

@ApiTags('Channels/Accounts')
@Controller({ path: '/channels/accounts', version: '2' })
export class AccountsController {
  constructor(
    private readonly accountService: AccountService,
    private readonly analyticsService: AnalyticsService,
    private readonly platformsService: PlatformsService,
  ) {}

  @ApiDoc({
    summary: '账号列表',
    query: ChannelAccountListQueryDto.schema,
    response: ChannelAccountListVo,
  })
  @Get('/')
  async list(
    @GetToken() token: TokenInfo,
    @Query() query: ChannelAccountListQueryDto,
  ) {
    return ChannelAccountListVo.create(await this.accountService.list(token.id, query))
  }

  @ApiDoc({
    summary: '批量删除账号',
    query: ChannelAccountDeleteQueryDto.schema,
  })
  @Delete('/')
  async deleteMany(
    @GetToken() token: TokenInfo,
    @Query() query: ChannelAccountDeleteQueryDto,
  ) {
    return this.accountService.deleteMany(token.id, query.ids)
  }

  @ApiDoc({
    summary: '账号详情',
    response: ChannelAccountVo,
  })
  @Get('/:accountId')
  async getById(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return ChannelAccountVo.create(await this.accountService.getById(token.id, accountId))
  }

  @ApiDoc({
    summary: '删除账号',
  })
  @Delete('/:accountId')
  async delete(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.delete(token.id, accountId)
  }

  @ApiDoc({
    summary: '账号授权状态',
    response: ChannelAccountAuthStatusVo,
  })
  @Get('/:accountId/auth-status')
  async authStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return ChannelAccountAuthStatusVo.create(await this.accountService.getAuthStatus(token.id, accountId))
  }

  @ApiDoc({
    summary: '账号数据',
    query: ChannelAccountAnalyticsQueryDto.schema,
    response: ChannelAccountAnalyticsVo,
  })
  @Get('/:accountId/analytics')
  async accountAnalytics(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: ChannelAccountAnalyticsQueryDto,
  ) {
    return ChannelAccountAnalyticsVo.create(
      await this.analyticsService.fetchAccountAnalytics(token.id, accountId, {
        since: query.since,
        until: query.until,
      }),
    )
  }

  @ApiDoc({
    summary: '获取账号平台动态发布选项取值',
    query: PublishOptionValuesQueryDto.schema,
    response: PublishOptionValuesVo,
  })
  @Get('/:accountId/publish-options/:field/values')
  async publishOptionValues(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('field') field: string,
    @Query() query: PublishOptionValuesQueryDto,
  ) {
    return PublishOptionValuesVo.create(
      await this.platformsService.getAccountValues(token.id, accountId, field, query),
    )
  }

  @ApiDoc({
    summary: '创建账号平台动态发布选项取值',
    body: PublishOptionCreateBodyDto.schema,
    response: PublishOptionCreatedValueVo,
  })
  @Post('/:accountId/publish-options/:field/values')
  async createPublishOptionValue(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('field') field: string,
    @Body() data: PublishOptionCreateBodyDto,
  ) {
    return PublishOptionCreatedValueVo.create(
      await this.platformsService.createAccountValue(token.id, accountId, field, data),
    )
  }

  @ApiDoc({
    summary: '创建账号',
    description: '仅支持插件授权平台创建账号',
    body: ChannelAccountCreateDto.schema,
  })
  @Post('/')
  async create(
    @GetToken() token: TokenInfo,
    @Body() data: ChannelAccountCreateDto,
  ) {
    return ChannelAccountVo.create(await this.accountService.addAccount(token.id, data))
  }
}
