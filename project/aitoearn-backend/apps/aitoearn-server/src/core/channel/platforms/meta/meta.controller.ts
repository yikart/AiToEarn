import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Internal, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { MetricEventHelperService, MetricEventName } from '@yikart/helpers'
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
} from './meta.dto'
import { MetaService } from './meta.service'
import { ThreadsService } from './threads.service'

@ApiTags('Platform/Meta')
@Controller('plat/meta')
export class MetaController {
  constructor(
    private readonly metaService: MetaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly threadsService: ThreadsService,
    private readonly metricEventHelperService: MetricEventHelperService,
  ) {}

  @ApiDoc({
    summary: 'Get Meta OAuth URL',
    body: GetAuthUrlBodySchema,
  })
  @Post('/auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlBodyDto) {
    const result = await this.metaService.generateAuthorizeURL(
      token.id,
      data.platform,
      data.scopes,
      data.spaceId || '',
      data.callbackUrl,
      data.callbackMethod,
    )

    if (result?.taskId || result?.state) {
      await this.metricEventHelperService.record(token.id, MetricEventName.aiPublishAddChannels, {
        bizKey: result.taskId ?? result.state,
        properties: { platform: data.platform },
      })
    }

    return result
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

  @ApiDoc({
    summary: 'List Facebook Page Published Posts',
  })
  @Get('/facebook/:accountId/published_posts')
  async getFacebookPagePublishedPosts(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.facebookService.getPagePublishedPosts(token.id, accountId, query)
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
    return await this.facebookService.getPageInsights(token.id, accountId, query)
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
    return await this.facebookService.getPostInsights(token.id, accountId, postId)
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
    return await this.instagramService.getAccountInfo(token.id, accountId, query)
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
    return await this.instagramService.getAccountInsights(token.id, accountId, query)
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
    return await this.instagramService.getMediaInsights(token.id, accountId, postId, query)
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
    return await this.threadsService.getAccountInsights(token.id, accountId, query)
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
    return await this.threadsService.getMediaInsights(token.id, accountId, postId, query)
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
    return await this.threadsService.searchLocations(token.id, accountId, keyword)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Facebook Page Insights (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/insights')
  async getCrawlerFacebookPageInsights(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPageInsightsByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Facebook Page Published Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/published_posts')
  async getCrawlerFacebookPagePublishedPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPagePublishedPostsByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Facebook Post Insights (Crawler)',
    body: CrawlerAccountPostDto.schema,
  })
  @Post('/facebook/post/insights')
  async getCrawlerFacebookPostInsights(@Body() data: CrawlerAccountPostDto) {
    return await this.facebookService.getPostInsightsByAccountId(data.accountId, data.postId)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Facebook Page Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/facebook/page/posts')
  async getCrawlerFacebookPagePosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPagePostsByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Facebook Page Post Comments (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/facebook/page/post/comments')
  async getCrawlerFacebookPostComments(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.facebookService.getPostCommentsByAccountId(data.accountId, data.postId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Instagram Account Info (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/instagram/account/info')
  async getCrawlerInstagramAccountInfo(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getAccountInfoByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Instagram Post Insights (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/instagram/post/insights')
  async getCrawlerInstagramPostInsights(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getMediaInsightsByAccountId(data.accountId, data.postId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Instagram User Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/instagram/user/posts')
  async getCrawlerInstagramUserPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.instagramService.getUserPostsByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Threads Account Insights (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/threads/account/insights')
  async getCrawlerThreadsAccountInsights(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getAccountInsightsByAccountId(data.accountId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Threads Post Insights (Crawler)',
    body: CrawlerAccountPostQueryDto.schema,
  })
  @Post('/threads/post/insights')
  async getCrawlerThreadsPostInsights(@Body() data: CrawlerAccountPostQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getMediaInsightsByAccountId(data.accountId, data.postId, query)
  }

  @Internal()
  @ApiDoc({
    summary: 'Get Threads User Posts (Crawler)',
    body: CrawlerAccountQueryDto.schema,
  })
  @Post('/threads/user/posts')
  async getCrawlerThreadsUserPosts(@Body() data: CrawlerAccountQueryDto) {
    const query: any = data.query || {}
    return await this.threadsService.getUserPostsByAccountId(data.accountId, query)
  }
}
