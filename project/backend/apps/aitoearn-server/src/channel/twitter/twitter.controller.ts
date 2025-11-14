import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatTwitterNatsApi } from '../../transports/channel/api/twitter.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthUrlDto,
} from './dto/twitter.dto'

@ApiTags('OpenSource/Platform/Twitter')
@Controller('plat/twitter')
export class TwitterController {
  constructor(
    private readonly platTwitterNatsApi: PlatTwitterNatsApi,
  ) {}

  @ApiDoc({
    summary: 'Get Twitter OAuth URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platTwitterNatsApi.getAuthUrl(token.id, data.scopes, data.spaceId || '')
    return res
  }

  @ApiDoc({
    summary: 'Get OAuth Task Status',
  })
  @Get('auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const res = await this.platTwitterNatsApi.getAuthInfo(taskId)
    return res
  }

  @Public()
  @UseGuards(OrgGuard)
  @ApiDoc({
    summary: 'Handle Twitter OAuth Callback',
    query: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Get('auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.platTwitterNatsApi.createAccountAndSetAccessToken(
      data.code,
      data.state,
    )
    return res.render('auth/back', result)
  }
}
