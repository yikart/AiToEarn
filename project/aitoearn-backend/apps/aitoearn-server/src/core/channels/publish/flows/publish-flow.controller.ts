import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreatePublishFlowDto } from './publish-flow.dto'
import { PublishFlowService } from './publish-flow.service'
import { ChannelPublishFlowVo } from './publish-flow.vo'

@ApiTags('Channels/Publish')
@Controller({ path: '/channels/publish/flows', version: '2' })
export class PublishFlowController {
  constructor(private readonly publishFlowService: PublishFlowService) {}

  @ApiDoc({
    summary: '创建发布 Flow',
    description: '创建多平台发布 flow，一次请求可生成多个单平台任务',
    body: CreatePublishFlowDto.schema,
    response: ChannelPublishFlowVo,
  })
  @Post('/')
  async createFlow(
    @GetToken() token: TokenInfo,
    @Body() body: CreatePublishFlowDto,
  ) {
    const result = await this.publishFlowService.createFlow(token.id, body)
    return result
  }

  @ApiDoc({
    summary: '获取 Flow 详情',
    description: '根据 flowId 获取发布 flow 聚合信息',
    response: ChannelPublishFlowVo,
  })
  @Get('/:flowId')
  async getFlow(
    @GetToken() token: TokenInfo,
    @Param('flowId') flowId: string,
  ) {
    const result = await this.publishFlowService.getFlowDetail(token.id, flowId)
    return result
  }
}
