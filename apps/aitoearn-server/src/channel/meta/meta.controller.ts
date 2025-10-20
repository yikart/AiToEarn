import { Body, Controller, Get, Param, Post, Query, Render } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { PlatMetaNatsApi } from '../api/meta.natsApi'
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
  ) {}

  @ApiOperation({ summary: '获取Meta平台 oAuth2.0 用户授权页面URL' })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platMetaNatsApi.getAuthUrl(token.id, data.platform, data.spaceId || '')
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
  @ApiOperation({ summary: '获取Facebook Page的已发布帖子列表' })
  @Get('facebook/:accountId/published_posts')
  async getFacebookPagePublishedPosts(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('pageId') pageId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPagePublishedPosts(
      accountId,
      query,
    )
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Facebook Page的Insights数据' })
  @Get('facebook/:accountId/insights')
  async getFacebookPageInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPageInsights(accountId, query)
  }

  @ApiOperation({ summary: '获取Facebook Page的Insights数据' })
  @Get('facebook/:accountId/:postId/insights')
  async getFacebookPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPostInsights(accountId, postId, query)
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Instagram Account的Insights数据' })
  @Get('instagram/:accountId')
  async getInstagramAccountInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramAccountInfo(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Instagram Account的Insights数据' })
  @Get('instagram/:accountId/insights')
  async getInstagramAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramAccountInsights(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: 'Instagram Post的Insights数据' })
  @Get('instagram/:accountId/:postId/insights')
  async getInstagramPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramPostInsights(accountId, postId, query)
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: 'threads Account的Insights数据' })
  @Get('threads/:accountId/insights')
  async getThreadsAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getThreadsAccountInsights(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiOperation({ summary: '获取Facebook Page的Insights数据' })
  @Get('threads/:accountId/:postId/insights')
  async getThreadsPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getThreadsPostInsights(accountId, postId, query)
  }

  @ApiOperation({ summary: 'threads查找location' })
  @Get('threads/locations')
  async searchThreadsLocation(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('keyword') keyword: string,
  ) {
    return await this.platMetaNatsApi.searchThreadsLocations(accountId, keyword)
  }
}
