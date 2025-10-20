import { Controller, Get, Param, Post, Query, Render, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatKwaiNatsApi } from '../api/kwai.natsApi'

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
  @Render('auth/back')
  async getAccessToken(
    @Param('taskId') taskId: string,
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    return await this.platKwaiNatsApi.createAccountAndSetAccessToken({
      taskId,
      ...query,
    })
  }
}
