import { Body, Controller, Get, Param, Post, Query, Render, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatTwitterNatsApi } from '../../transports/channel/api/twitter.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthUrlDto,
} from './dto/twitter.dto'

@ApiTags('plat/twitter - Twitter平台')
@Controller('plat/twitter')
export class TwitterController {
  constructor(
    private readonly platTwitterNatsApi: PlatTwitterNatsApi,
  ) {}

  @ApiOperation({ summary: '获取Twitter oAuth2.0 用户授权页面URL' })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platTwitterNatsApi.getAuthUrl(token.id, data.scopes, data.spaceId || '')
    return res
  }

  @ApiOperation({ summary: '查询用户oAuth2.0任务状态' })
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
  @ApiOperation({ summary: 'oAuth认证回调后续操作, 保存AccessToken并创建用户' })
  @Get('auth/back')
  @Render('auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.platTwitterNatsApi.createAccountAndSetAccessToken(
      data.code,
      data.state,
    )
  }
}
