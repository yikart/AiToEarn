import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatBilibiliApi } from './bilibili.api'
import { BilibiliService } from './bilibili.service'
import {
  GetArchiveListDto,
  GetArcStatDto,
} from './dto/bilibili.dto'

@ApiTags('plat/bilibili - B站平台')
@Controller('plat/bilibili')
export class BilibiliController {
  constructor(
    private readonly bilibiliService: BilibiliService,
    private readonly platBilibiliApi: PlatBilibiliApi,
  ) {}

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
    const res = await this.platBilibiliApi.createAccountAndSetAccessToken({
      taskId,
      ...query,
    })
    return res
  }

  @ApiOperation({ summary: '获取页面的认证URL' })
  @Get('auth/url/:type')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
  ) {
    const res = await this.platBilibiliApi.getAuth(token.id, type, spaceId || '')
    return res
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platBilibiliApi.getAuthInfo(taskId)
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.bilibiliService.checkAccountAuthStatus(accountId)
  }

  @ApiOperation({ summary: '分区查询' })
  @Get('archive/type/list/:accountId')
  async archiveTypeList(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.archiveTypeList(accountId)
  }

  @ApiOperation({ summary: '获取稿件列表' })
  @Get('archive/list/:pageNo/:pageSize')
  async getArchiveList(
    @GetToken() token: TokenInfo,
    @Param() page: TableDto,
    @Query() query: GetArchiveListDto,
  ) {
    return this.platBilibiliApi.getArchiveList(query.accountId, page, {
      status: query.status,
    })
  }

  @ApiOperation({ summary: '获取用户数据' })
  @Get('stat/user/:accountId')
  async getUserStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.getUserStat(accountId)
  }

  @ApiOperation({ summary: '获取稿件数据' })
  @Get('stat/arc')
  async getArcStat(
    @GetToken() token: TokenInfo,
    @Query() query: GetArcStatDto,
  ) {
    return this.platBilibiliApi.getArcStat(
      query.accountId,
      query.resourceId,
    )
  }

  @ApiOperation({ summary: '获取稿件增量数据数据' })
  @Get('stat/inc/arc/:accountId')
  async getArcIncStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.getArcIncStat(accountId)
  }
}
