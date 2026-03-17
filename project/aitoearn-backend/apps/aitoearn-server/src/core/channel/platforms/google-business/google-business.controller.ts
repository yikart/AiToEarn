import { Controller, Get, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { GoogleBusinessAuthCallbackDto } from './google-business.dto'
import { GoogleBusinessService } from './google-business.service'

@ApiTags('Platform/Google Business')
@Controller('plat/google-business')
export class GoogleBusinessController {
  constructor(
    private readonly googleBusinessService: GoogleBusinessService,
  ) {}

  @ApiDoc({ summary: '获取授权 URL' })
  @Get('/auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo) {
    return await this.googleBusinessService.getAuthUrl(token.id)
  }

  @Public()
  @ApiDoc({ summary: 'OAuth 回调' })
  @Get('/auth/callback')
  async authCallback(
    @Query() query: GoogleBusinessAuthCallbackDto,
    @Res() res: Response,
  ) {
    const result = await this.googleBusinessService.handleCallback(query.code, query.state)

    if (result.status === 1) {
      res.redirect(`/auth/success?accountId=${result.accountId}`)
    }
    else {
      res.redirect(`/auth/error?message=${encodeURIComponent(result.message)}`)
    }
  }

  @ApiDoc({ summary: '获取授权状态' })
  @Get('/auth/status')
  async getAuthStatus(@GetToken() token: TokenInfo, @Query('state') state: string) {
    return await this.googleBusinessService.getAuthStatus(state)
  }
}
