import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatKwaiNatsApi } from '../../transports/channel/api/kwai.natsApi'
import { AccountIdDto } from '../bilibili/dto/bilibili.dto'

@ApiTags('OpenSource/Platform/Kwai')
@Controller('plat/kwai')
export class KwaiController {
  constructor(
    private readonly platKwaiNatsApi: PlatKwaiNatsApi,
  ) {}

  @ApiDoc({
    summary: 'Create Authorization Task',
  })
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

  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
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
  @ApiDoc({
    summary: 'Handle Kwai OAuth Callback',
  })
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

  @ApiDoc({
    summary: 'Get Author Information',
    body: AccountIdDto.schema,
  })
  @Post('auth/info')
  async getAuthorInfo(
    @Body() data: AccountIdDto,
  ) {
    return this.platKwaiNatsApi.getAuthorInfo(data)
  }
}
