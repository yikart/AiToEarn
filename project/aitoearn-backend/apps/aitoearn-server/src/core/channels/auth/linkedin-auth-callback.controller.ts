import type { Response } from 'express'
import { Controller, Get, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc } from '@yikart/common'
import { AuthCallbackQueryDto } from './auth.dto'

@ApiTags('Channels/Auth')
@Controller('plat/meta')
export class LinkedInAuthCallbackController {
  @ApiDoc({
    summary: 'LinkedIn 旧 OAuth 回调兼容入口',
    description: '兼容 LinkedIn 专属旧回调地址，并转发到新版 channels 回调处理。',
    query: AuthCallbackQueryDto.schema,
  })
  @Public()
  @Get('/auth/back')
  handleLinkedInCallback(
    @Query() query: AuthCallbackQueryDto,
    @Res() res: Response,
  ) {
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
    const callbackPath = `/api/v2/channels/accounts/auth/${AccountType.LinkedIn}/callback`
    return res.redirect(302, search ? `${callbackPath}?${search}` : callbackPath)
  }
}
