import type { Request, Response } from 'express'
import { All, Controller, Get, Query, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, SkipResponseInterceptor } from '@yikart/common'
import { AuthCallbackQueryDto } from '../../auth/auth.dto'
import { PlatformsService } from '../platforms.service'

@ApiTags('Platform/TikTok Legacy')
@Controller('plat/tiktok')
export class TikTokLegacyController {
  constructor(private readonly platformsService: PlatformsService) {}

  @ApiDoc({
    summary: 'TikTok 旧 OAuth 回调兼容入口',
    description: '兼容 TikTok 旧回调地址，并转发到新版 channels 回调处理。',
    query: AuthCallbackQueryDto.schema,
  })
  @Public()
  @Get('/auth/back')
  handleAuthBack(
    @Query() query: AuthCallbackQueryDto,
    @Res() res: Response,
  ) {
    return this.redirectToChannelsCallback(query, res)
  }

  @ApiDoc({
    summary: 'TikTok 旧 OAuth redirect 兼容入口',
    description: '兼容 TikTok 旧 redirect 地址，并转发到新版 channels 回调处理。',
    query: AuthCallbackQueryDto.schema,
  })
  @Public()
  @Get('/auth/redirect')
  handleAuthRedirect(
    @Query() query: AuthCallbackQueryDto,
    @Res() res: Response,
  ) {
    return this.redirectToChannelsCallback(query, res)
  }

  @ApiDoc({
    summary: 'TikTok 旧 Webhook 兼容入口',
    description: '兼容旧 TikTok webhook 地址，并交给新版平台 webhook 分发处理。',
  })
  @Public()
  @SkipResponseInterceptor()
  @All('/webhook')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.platformsService.dispatchWebhook(AccountType.TikTok, req, res)
  }

  private redirectToChannelsCallback(query: AuthCallbackQueryDto, res: Response) {
    const params = new URLSearchParams()
    if (query.code)
      params.set('code', query.code)
    if (query.state)
      params.set('state', query.state)
    if (query.error)
      params.set('error', query.error)
    if (query.error_description)
      params.set('error_description', query.error_description)
    const search = params.toString()
    const callbackPath = `/api/v2/channels/accounts/auth/${AccountType.TikTok}/callback`
    return res.redirect(302, search ? `${callbackPath}?${search}` : callbackPath)
  }
}
