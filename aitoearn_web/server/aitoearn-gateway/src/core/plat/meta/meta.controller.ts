import { Body, Controller, Get, Param, Post, Query, Render } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { PlatMetaNatsApi } from 'src/transports/channel/meta.natsApi'
import { AccountNatsApi } from '../../../transports/account/account.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  FacebookPageSelectionDto,
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

  @ApiOperation({ summary: '选择确认Facebook Pages' })
  @Post('facebook/pages')
  async selectFacebookPages(
    @GetToken() token: TokenInfo,
    @Body() data: FacebookPageSelectionDto,
  ) {
    const res = await this.platMetaNatsApi.selectFacebookPages(token.id, data.pageIds)
    return res
  }

  @Public()
  @ApiOperation({ summary: 'oAuth认证回调后续操作, 保存AccessToken并创建用户' })
  @Get('auth/back')
  @Render('auth/meta')
  async createAccountAndSetAccessToken(
    @Query() query: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.platMetaNatsApi.createAccountAndSetAccessToken(
      query.code,
      query.state,
    )
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取指定用户的Facebook Pages' })
  @Get('facebook/:userId/pages')
  async getFacebookPagesByUserId(
    @GetToken() token: TokenInfo,
    @Param('userId') userId: string,
  ) {
    const res = await this.platMetaNatsApi.getFacebookPages(userId)
    return res
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Facebook Page的已发布帖子列表' })
  @Get('facebook/:accountId/:pageId/published_posts')
  async getFacebookPagePublishedPosts(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('pageId') pageId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPagePublishedPosts(
      accountId,
      pageId,
      query,
    )
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Facebook Page的Insights数据' })
  @Get('facebook/:accountId/:pageId/insights')
  async getFacebookPageInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('pageId') pageId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPageInsights(accountId, pageId, query)
  }
}
