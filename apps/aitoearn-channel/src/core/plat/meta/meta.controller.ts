import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { FacebookInsightsRequest, FacebookPagePostRequest, FacebookPostEdgesRequest, FacebookPublishedPostRequest } from '../../../libs/facebook/facebook.interfaces'
import { InstagramInsightsRequest, InstagramMediaInsightsRequest, InstagramUserPostRequest } from '../../../libs/instagram/instagram.interfaces'
import { ThreadsInsightsRequest, ThreadsPostsRequest } from '../../../libs/threads/threads.interfaces'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  PagesSelectionDto,
  UserIdDto,
} from './dto/meta.dto'
import { FacebookService } from './facebook.service'
import { InstagramService } from './instagram.service'
import { LinkedinService } from './linkedin.service'
import { MetaService } from './meta.service'
import { ThreadsService } from './threads.service'

@Controller()
export class MetaController {
  constructor(
    private readonly metaService: MetaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly threadsService: ThreadsService,
    private readonly linkedinService: LinkedinService,
  ) { }

  // generate authorization URL
  // @NatsMessagePattern('plat.meta.authUrl')
  @Post('plat/meta/authUrl')
  async generateAuthorizeURL(@Body() data: GetAuthUrlDto) {
    return await this.metaService.generateAuthorizeURL(
      data.userId,
      data.platform,
      data.scopes,
      data.spaceId,
    )
  }

  // check oauth task status
  // @NatsMessagePattern('plat.meta.getAuthInfo')
  @Post('plat/meta/getAuthInfo')
  async getOAuth2TaskInfo(@Body() data: GetAuthInfoDto) {
    return await this.metaService.getOAuth2TaskInfo(data.taskId)
  }

  // @NatsMessagePattern('plat.meta.facebook.pages')
  @Post('plat/meta/facebook/pages')
  @Get('facebook/pages')
  async getAuthInfo(@Body() data: UserIdDto) {
    return await this.metaService.getFacebookPageList(data.userId)
  }

  // @NatsMessagePattern('plat.meta.facebook.pages.selection')
  @Post('plat/meta/facebook/pages/selection')
  @Post('facebook/pages')
  async selectFacebookPages(@Body() data: PagesSelectionDto) {
    return await this.metaService.selectFacebookPages(data.userId, data.pageIds)
  }

  // restFul API for get oauth authorize URL
  @Get('oauth2/authorize_url/:platform')
  async getOAuthAuthUri(
    @Param('platform') platform: string,
    @Query()
    query: {
      userId: string
      scopes?: string[]
    },
  ) {
    return await this.metaService.generateAuthorizeURL(
      query.userId,
      platform,
      query.scopes,
    )
  }

  // restFul API for post oauth callback
  @Get('auth/callback')
  async postOAuth2CallbackByRestFul(
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    return await this.metaService.postOAuth2Callback(query.state, {
      code: query.code,
      state: query.state,
    })
  }

  // NATS message pattern for post oauth callback
  // get access token and create account
  // @NatsMessagePattern('plat.meta.createAccountAndSetAccessToken')
  @Post('plat/meta/createAccountAndSetAccessToken')
  async postOAuth2Callback(@Body() data: CreateAccountAndSetAccessTokenDto) {
    return await this.metaService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })
  }

  // @NatsMessagePattern('plat.meta.facebook.page.insights')
  @Post('plat/meta/facebook/page/insights')
  async getFacebookPageInsights(
    @Body() data: { accountId: string, query: FacebookInsightsRequest },
  ) {
    return await this.facebookService.getPageInsights(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.facebook.post.insights')
  @Post('plat/meta/facebook/post/insights')
  async getFacebookPostInsights(
    @Body() data: { accountId: string, postId: string },
  ) {
    return await this.facebookService.getPostInsights(
      data.accountId,
      data.postId,
    )
  }

  // @NatsMessagePattern('plat.meta.facebook.page.published_posts')
  @Post('plat/meta/facebook/page/published_posts')
  async getFacebookPagePosts(
    @Body() data: { accountId: string, query: FacebookPublishedPostRequest },
  ) {
    return await this.facebookService.getPagePublishedPosts(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.instagram.account.info')
  @Post('plat/meta/instagram/account/info')
  async getInstagramAccountInfo(
    @Body() data: { accountId: string, query?: any },
  ) {
    return await this.instagramService.getAccountInfo(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.instagram.account.insights')
  @Post('plat/meta/instagram/account/insights')
  async getInstagramAccountInsights(
    @Body() data: { accountId: string, query: InstagramInsightsRequest },
  ) {
    return await this.instagramService.getAccountInsights(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.instagram.post.insights')
  @Post('plat/meta/instagram/post/insights')
  async getInstagramPostInsights(
    @Body() data: { accountId: string, postId: string, query: InstagramMediaInsightsRequest },
  ) {
    return await this.instagramService.getMediaInsights(
      data.accountId,
      data.postId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.threads.account.insights')
  @Post('plat/meta/threads/account/insights')
  async getThreadsAccountInsights(
    @Body() data: { accountId: string, query: ThreadsInsightsRequest },
  ) {
    return await this.threadsService.getAccountInsights(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.threads.post.insights')
  @Post('plat/meta/threads/post/insights')
  async getThreadsPostInsights(
    @Body() data: { accountId: string, postId: string, query: ThreadsInsightsRequest },
  ) {
    return await this.threadsService.getMediaInsights(
      data.accountId,
      data.postId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.facebook.page.posts')
  @Post('plat/meta/facebook/page/posts')
  async getFacebookPagePostsDetail(
    @Body() data: { accountId: string, query: FacebookPagePostRequest },
  ) {
    return await this.facebookService.getPostPosts(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.facebook.page.post.comments')
  @Post('plat/meta/facebook/page/post/comments')
  async getFacebookPagePostComments(
    @Body() data: { accountId: string, postId: string, query: FacebookPostEdgesRequest },
  ) {
    return await this.facebookService.getPostComments(
      data.accountId,
      data.postId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.instagram.user.posts')
  @Post('plat/meta/instagram/user/posts')
  async getInstagramUserPosts(
    @Body() data: { accountId: string, query: InstagramUserPostRequest },
  ) {
    return await this.instagramService.getUserPosts(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.threads.user.posts')
  @Post('plat/meta/threads/user/posts')
  async getThreadsUserPosts(
    @Body() data: { accountId: string, query: ThreadsPostsRequest },
  ) {
    return await this.threadsService.getUserPosts(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.facebool.search.locations')
  @Post('plat/meta/facebool/search/locations')
  async searchFacebookLocations(
    @Body() data: { accountId: string, keyword: string },
  ) {
    return await this.facebookService.searchPages(
      data.accountId,
      data.keyword,
    )
  }

  // @NatsMessagePattern('plat.meta.threads.search.locations')
  @Post('plat/meta/threads/search/locations')
  async searchThreadsLocations(
    @Body() data: { accountId: string, keyword: string },
  ) {
    return await this.threadsService.searchLocations(
      data.accountId,
      data.keyword,
    )
  }

  // @NatsMessagePattern('plat.meta.accessTokenStatus')
  @Post('plat/meta/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: { accountId: string, platform: string }) {
    return await this.metaService.getAccessTokenStatus(data.accountId, data.platform)
  }

  @Post('facebook/posts/attachments')
  async getFacebookPostAttachments(
    @Body() data: { postId: string, accountId: string },
  ) {
    return await this.facebookService.fetchPostAttachments(data.accountId, data.postId)
  }

  @Delete('facebook/posts/:postId')
  async deleteFacebookPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.facebookService.deletePost(data.accountId, postId)
  }

  @Delete('threads/posts/:postId')
  async deleteThreadsPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.threadsService.deletePost(postId, data.accountId)
  }

  @Delete('linkedin/:accountId/posts/:postId')
  async deleteLinkedinPost(
    @Param('postId') postId: string,
    @Param('accountId') accountId: string,
  ) {
    return await this.linkedinService.deletePost(accountId, postId)
  }
}
