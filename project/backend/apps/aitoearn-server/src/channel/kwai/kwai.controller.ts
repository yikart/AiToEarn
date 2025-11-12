import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { Response } from 'express'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatKwaiNatsApi } from '../../transports/channel/api/kwai.natsApi'
import { AccountIdDto } from '../bilibili/dto/bilibili.dto'

@ApiTags('plat/kwai - 快手平台')
@Controller('plat/kwai')
export class KwaiController {
  constructor(
    private readonly platKwaiNatsApi: PlatKwaiNatsApi,
  ) {}

  @ApiOperation({ summary: '开始授权，创建任务' })
  @Get('auth/url/:type')
  async getAuth(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
  ) {
    return await this.platKwaiNatsApi.getAuth({
      userId: token.id,
      type,
      spaceId: spaceId || '',
    })
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platKwaiNatsApi.getAuthInfo(taskId)
  }

  // 授权回调，创建账号
  @Public()
  @UseGuards(OrgGuard)
  @Get('auth/back/:taskId')
  async getAccessToken(
    @Param('taskId') taskId: string,
    @Query()
    query: {
      code: string
      state: string
    },
    @Res() res: Response,
  ) {
    const result = await this.platKwaiNatsApi.createAccountAndSetAccessToken({
      taskId,
      ...query,
    })
    return res.render('auth/back', result)
  }

  @ApiOperation({ summary: 'get author info' })
  @Post('auth/info')
  async getAuthorInfo(
    @Body() data: AccountIdDto,
  ) {
    return this.platKwaiNatsApi.getAuthorInfo(data)
  }
}
