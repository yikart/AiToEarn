import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { FacebookService } from './facebook.service'
import { InstagramService } from './instagram.service'
import {
  CrawlerAccountPostDto,
  CrawlerAccountPostQueryDto,
  CrawlerAccountQueryDto,
  CreateAccountAndSetAccessTokenDto,
  CreateAccountAndSetAccessTokenSchema,
  FacebookPageSelectionDto,
  FacebookPageSelectionSchema,
  GetAuthUrlBodyDto,
  GetAuthUrlBodySchema,
  GetNoUserAuthUrlDto,
  GetNoUserAuthUrlSchema,
} from './meta.dto'
import { MetaService } from './meta.service'
import { ThreadsService } from './threads.service'

@ApiTags('Platform/Meta')
@Controller('plat/meta')
export class MetaController {
  private readonly logger = new Logger(MetaController.name)

  constructor(
    private readonly metaService: MetaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly threadsService: ThreadsService,
  ) {}

  @Public()
  @ApiDoc({
    summary: 'Get Instagram Public no token Authorization URL',
    body: GetNoUserAuthUrlSchema,
  })
  @Post('/auth/url/public')
  async getNoUserAuthUrl(@Body() data: GetNoUserAuthUrlDto) {
    return await this.metaService.getNoUserAuthUrl(data.materialGroupId)
  }

  @ApiDoc({
    summary: 'Get Meta OAuth URL',
    body: GetAuthUrlBodySchema,
  })
  @Post('/auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlBodyDto) {
    return await this.metaService.generateAuthorizeURL(
      token.id,
      data.platform,
      data.scopes,
      data.spaceId || '',
      data.callbackUrl,
      data.callbackMethod,
    )
  }

  @ApiDoc({
    summary: 'Get OAuth Task Status',
  })
  @Get('/auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return await this.metaService.getOAuth2TaskInfo(taskId)
  }

  @ApiDoc({
    summary: 'List Facebook Pages',
  })
  @Get('/facebook/pages')
  async getFacebookPages(
    @GetToken() token: TokenInfo,
  ) {
    return await this.metaService.getFacebookPageList(token.id)
  }

  @ApiDoc({
    summary: 'Select Facebook Pages',
    body: FacebookPageSelectionSchema,
  })
  @Post('/facebook/pages')
  async selectFacebookPages(
    @GetToken() token: TokenInfo,
    @Body() data: FacebookPageSelectionDto,
  ) {
    return await this.metaService.selectFacebookPages(token.id, data.pageIds)
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Meta OAuth Callback',
    query: CreateAccountAndSetAccessTokenSchema,
  })
  @Get('/auth/back')
  async createAccountAndSetAccessToken(
    @Query() query: CreateAccountAndSetAccessTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.metaService.postOAuth2Callback(query.state, {
      code: query.code,
      state: query.state,
    })

    if (result && 'callbackUrl' in result && result.callbackUrl) {
      return res.render('auth/back', { ...result, autoPostCallback: true })
    }

    return res.render('auth/meta', result ?? {})
  }

  @Public()
  @ApiDoc({
    summary: 'Instagram授权重定向',
    description: '处理Instagram授权回调，创建账号并保存到数据库，然后301重定向到配置的URL。重定向URL格式：{reDirectBaseUrl}?accountId={accountId}&materialGroupId={state}',
    query: CreateAccountAndSetAccessTokenSchema,
  })
  @Get('/auth/redirect')
  async handleAuthRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const { redirectUrl } = await this.metaService.handleAuthRedirect(code, state)
    this.logger.debug({
      path: 'server handleAuthRedirect',
      data: {
        redirectUrl,
      },
    })

    return res.redirect(301, redirectUrl)
  }

  @ApiDoc({
    summary: 'List Facebook Page Published Posts',
  })
  @Get('/facebook/:accountId/published_posts')
  async getFacebookPagePublishedPosts(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.facebookService.getPagePublishedPosts(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Facebook Page Insights',
  })
  @Get('/facebook/:accountId/insights')
  async getFacebookPageInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.facebookService.getPageInsights(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Facebook Post Insights',
  })
  @Get('/facebook/:accountId/:postId/insights')
  async getFacebookPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
  ) {
    return await this.facebookService.getPostInsights(accountId, postId)
  }

  @ApiDoc({
    summary: 'Get Instagram Account Info',
  })
  @Get('/instagram/:accountId')
  async getInstagramAccountInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.instagramService.getAccountInfo(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Instagram Account Insights',
  })
  @Get('/instagram/:accountId/insights')
  async getInstagramAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.instagramService.getAccountInsights(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Instagram Post Insights',
  })
  @Get('/instagram/:accountId/:postId/insights')
  async getInstagramPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.instagramService.getMediaInsights(accountId, postId, query)
  }

  @ApiDoc({
    summary: 'Get Threads Account Insights',
  })
  @Get('/threads/:accountId/insights')
  async getThreadsAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.threadsService.getAccountInsights(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Threads Post Insights',
  })
  @Get('/threads/:accountId/:postId/insights')
  async getThreadsPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.threadsService.getMediaInsights(accountId, postId, query)
  }

  @ApiDoc({
    summary: 'Search Threads Locations',
  })
  @Get('/threads/locations')
  async searchThreadsLocation(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('keyword') keyword: string,
  ) {
    return await this.threadsService.searchLocations(accountId, keyword)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Facebook Page Insights (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/insights')
  async getCrawlerFacebookPageInsights(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPageInsights(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Facebook Page Published Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/published_posts')
  async getCrawlerFacebookPagePublishedPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPagePublishedPosts(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Facebook Post Insights (Crawler)',
    body: CrawlerAccountPostDto.schema,
  })
  @Post('/facebook/post/insights')
  async getCrawlerFacebookPostInsights(@Body() data: CrawlerAccountPostDto) {
    return await this.facebookService.getPostInsights(data.accountId, data.postId)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Facebook Page Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/posts')
  async getCrawlerFacebookPagePosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPagePosts(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Facebook Page Post Comments (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/facebook/page/post/comments')
  async getCrawlerFacebookPostComments(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPostComments(data.accountId, data.postId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Instagram Account Info (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/instagram/account/info')
  async getCrawlerInstagramAccountInfo(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getAccountInfo(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Instagram Post Insights (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/instagram/post/insights')
  async getCrawlerInstagramPostInsights(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getMediaInsights(data.accountId, data.postId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Instagram User Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/instagram/user/posts')
  async getCrawlerInstagramUserPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getUserPosts(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Threads Account Insights (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/threads/account/insights')
  async getCrawlerThreadsAccountInsights(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getAccountInsights(data.accountId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Threads Post Insights (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/threads/post/insights')
  async getCrawlerThreadsPostInsights(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getMediaInsights(data.accountId, data.postId, query)
  }

  @Public()
  @ApiDoc({
    summary: 'Get Threads User Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/threads/user/posts')
  async getCrawlerThreadsUserPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getUserPosts(data.accountId, query)
  }
}
