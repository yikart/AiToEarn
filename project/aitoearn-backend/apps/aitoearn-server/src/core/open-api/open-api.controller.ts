import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { ChannelAccountListQueryDto } from '../channels/accounts/account.dto'
import { AccountService } from '../channels/accounts/account.service'
import { PlatformIntegrationRegistry } from '../channels/platforms/platforms.registry'
import { CreatePublishFlowDto } from '../channels/publish/flows/publish-flow.dto'
import { PublishFlowService } from '../channels/publish/flows/publish-flow.service'
import { ChannelPublishFlowVo } from '../channels/publish/flows/publish-flow.vo'

/**
 * 对外开放 API（/v1/open/*）：供第三方开发者与 Agent 调用。
 * 鉴权复用全局 AitoearnAuthGuard：x-api-key 或 Bearer JWT 均可。
 * 中国版 https://aitoearn.cn，国际版 https://aitoearn.ai，API Key 与所属环境必须匹配。
 */
@ApiTags('Open API')
@Controller({ path: '/open', version: '1' })
export class OpenApiController {
  constructor(
    private readonly platformRegistry: PlatformIntegrationRegistry,
    private readonly accountService: AccountService,
    private readonly publishFlowService: PublishFlowService,
  ) {}

  @ApiDoc({
    summary: '列出可发布平台',
    description: '返回所有已接入渠道的平台元数据与能力声明，无需账号即可调用',
  })
  @Get('/platforms')
  async listPlatforms() {
    return this.platformRegistry.listMetadata()
  }

  @ApiDoc({
    summary: '列出已授权账号',
    description: '返回当前 key 所属用户已授权的渠道账号，发布前用于选择账号',
    query: ChannelAccountListQueryDto.schema,
  })
  @Get('/accounts')
  async listAccounts(
    @GetToken() token: TokenInfo,
    @Query() query: ChannelAccountListQueryDto,
  ) {
    return this.accountService.list(token.id, query)
  }

  @ApiDoc({
    summary: '创建发布任务',
    description: '创建多平台发布 flow，一次请求可生成多个单平台任务；请调用方自行保证幂等键稳定，重复提交同一 flow 前应先查询',
    body: CreatePublishFlowDto.schema,
    response: ChannelPublishFlowVo,
  })
  @Post('/publish/flows')
  async createPublishFlow(
    @GetToken() token: TokenInfo,
    @Body() body: CreatePublishFlowDto,
  ) {
    return this.publishFlowService.createFlow(token.id, body)
  }

  @ApiDoc({
    summary: '查询发布状态',
    description: '按 flowId 查询发布进度与各平台任务状态，建议每 3-5 秒轮询直至全部终态',
    response: ChannelPublishFlowVo,
  })
  @Get('/publish/flows/:flowId')
  async getPublishFlow(
    @GetToken() token: TokenInfo,
    @Param('flowId') flowId: string,
  ) {
    return this.publishFlowService.getFlowDetail(token.id, flowId)
  }
}
