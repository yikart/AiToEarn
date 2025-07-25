import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { PlatMetaNatsApi } from 'src/transports/channel/meta.natsApi'
import { AccountNatsApi } from '../../../transports/account/account.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthUrlDto,
} from './dto/meta.dto'

@ApiTags('plat/meta - Meta平台')
@Controller('plat/meta')
export class MetaController {
  constructor(
    private readonly platMetaNatsApi: PlatMetaNatsApi,
    private readonly accountNatsApi: AccountNatsApi,
  ) {}

  @ApiOperation({ summary: '获取Meta平台 oAuth2.0 用户授权页面URL' })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platMetaNatsApi.getAuthUrl(token.id, data.platform)
    return res
  }

  @ApiOperation({ summary: '查询用户oAuth2.0任务状态' })
  @Get('auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const res = await this.platMetaNatsApi.getAuthInfo(taskId)
    return res
  }

  @ApiOperation({ summary: '查询Facebook用户Pages列表' })
  @Get('facebook/pages')
  async getFacebookPages(
    @GetToken() token: TokenInfo,
  ) {
    const res = await this.platMetaNatsApi.getFacebookPages(token.id)
    return res
  }

  @ApiOperation({ summary: 'oAuth认证回调后续操作, 保存AccessToken并创建用户' })
  @Post('auth/create-account')
  async createAccountAndSetAccessToken(
    @GetToken() token: TokenInfo,
    @Body() data: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.platMetaNatsApi.createAccountAndSetAccessToken(
      data.taskId,
      data.code,
      data.state,
    )
  }
}
