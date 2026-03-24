import { Controller, Get, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { GetAuthUrlDto, GoogleBusinessAuthCallbackDto } from './google-business.dto'
import { GoogleBusinessService } from './google-business.service'

@ApiTags('Platform/Google Business')
@Controller('plat/google-business')
export class GoogleBusinessController {
  constructor(
    private readonly googleBusinessService: GoogleBusinessService,
  ) {}

  @ApiDoc({ summary: '获取授权 URL' })
  @Get('/auth/url')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Query() query: GetAuthUrlDto,
  ) {
    return await this.googleBusinessService.getAuthUrl(
      token.id,
      query.callbackUrl,
      query.callbackMethod,
    )
  }

  @Public()
  @ApiDoc({ summary: 'OAuth 回调' })
  @Get('/auth/callback')
  async authCallback(
    @Query() query: GoogleBusinessAuthCallbackDto,
    @Res() res: Response,
  ) {
    const result = await this.googleBusinessService.handleCallback(query.code, query.state)

    if (result.status === 1 && result.callbackUrl) {
      return res.render('auth/back', {
        ...result,
        autoPostCallback: true,
      })
    }

    if (result.status === 1) {
      return res.redirect(`/auth/success?accountId=${result.accountId}`)
    }

    return res.redirect(`/auth/error?message=${encodeURIComponent(result.message || '')}`)
  }

  @ApiDoc({ summary: '获取授权状态' })
  @Get('/auth/status')
  async getAuthStatus(@GetToken() token: TokenInfo, @Query('state') state: string) {
    return await this.googleBusinessService.getAuthStatus(state)
  }
}
