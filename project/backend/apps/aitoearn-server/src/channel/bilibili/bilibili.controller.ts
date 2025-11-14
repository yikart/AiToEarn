import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, TableDto } from '@yikart/common'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatBilibiliNatsApi } from '../../transports/channel/api/bilibili.natsApi'
import { BilibiliService } from './bilibili.service'
import {
  GetArchiveListDto,
  GetArcStatDto,
} from './dto/bilibili.dto'

@ApiTags('OpenSource/Platform/Bilibili')
@Controller('plat/bilibili')
export class BilibiliController {
  constructor(
    private readonly bilibiliService: BilibiliService,
    private readonly platBilibiliApi: PlatBilibiliNatsApi,
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

  @ApiDoc({
    summary: 'Get Authorization URL',
  })
  @Get('auth/url/:type')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('spaceId') spaceId?: string,
  ) {
    const res = await this.platBilibiliApi.getAuth(token.id, type, spaceId || '')
    return res
  }

  @ApiDoc({
    summary: 'Get Authorization Callback Result',
  })
  @Post('auth/create-account/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return this.platBilibiliApi.getAuthInfo(taskId)
  }

  @ApiDoc({
    summary: 'Check Account Authorization Status',
  })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.bilibiliService.checkAccountAuthStatus(accountId)
  }

  @ApiDoc({
    summary: 'List Archive Categories',
  })
  @Get('archive/type/list/:accountId')
  async archiveTypeList(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.archiveTypeList(accountId)
  }

  @ApiDoc({
    summary: 'List Archives',
    query: GetArchiveListDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get User Statistics',
  })
  @Get('stat/user/:accountId')
  async getUserStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.getUserStat(accountId)
  }

  @ApiDoc({
    summary: 'Get Archive Statistics',
    query: GetArcStatDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Archive Increment Statistics',
  })
  @Get('stat/inc/arc/:accountId')
  async getArcIncStat(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.platBilibiliApi.getArcIncStat(accountId)
  }
}
