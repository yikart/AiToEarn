import type { AccountType } from '@yikart/common'
import type { Request, Response } from 'express'
import { All, Controller, Get, Param, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc, SkipResponseInterceptor } from '@yikart/common'
import { PlatformIntegrationRegistry } from './platforms.registry'
import { PlatformsService } from './platforms.service'
import { PlatformMetadataVo, PublishOptionSourceVo } from './platforms.vo'

@ApiTags('Channels/Platforms')
@Controller({ path: '/channels/platforms', version: '2' })
export class PlatformsController {
  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly platformsService: PlatformsService,
  ) {}

  @ApiDoc({
    summary: '获取所有平台元数据',
    description: '返回已注册平台的元数据列表，包括展示名、logo、能力声明等',
    response: [PlatformMetadataVo],
  })
  @Public()
  @Get('/')
  listPlatforms() {
    return this.registry.listMetadata().map(metadata => PlatformMetadataVo.create(metadata))
  }

  @ApiDoc({
    summary: '获取平台动态发布选项',
    description: '返回该平台发布选项字段的动态取值来源',
    response: [PublishOptionSourceVo],
  })
  @Get('/:platform/publish-options')
  listPublishOptions(@Param('platform') platform: AccountType) {
    return this.platformsService.listSources(platform)
      .map(source => PublishOptionSourceVo.create(source))
  }

  @ApiDoc({
    summary: '统一平台 Webhook 入口',
    description: '接收各平台 webhook 请求，由 platform 参数分发给对应平台 provider 自行处理',
  })
  @Public()
  @SkipResponseInterceptor()
  @All('/:platform/webhooks')
  async handleWebhook(
    @Param('platform') platform: AccountType,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.platformsService.dispatchWebhook(platform, req, res)
  }
}
