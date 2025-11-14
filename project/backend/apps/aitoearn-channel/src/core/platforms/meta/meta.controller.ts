import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
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

@ApiTags('OpenSource/Core/Platforms/Meta')
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
  @ApiDoc({
    summary: 'Generate Meta Authorization URL',
  })
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
  @ApiDoc({
    summary: 'Get Authorization Task Info',
  })
  @Post('plat/meta/getAuthInfo')
  async getOAuth2TaskInfo(@Body() data: GetAuthInfoDto) {
    return await this.metaService.getOAuth2TaskInfo(data.taskId)
  }

  // @NatsMessagePattern('plat.meta.facebook.pages')
  @ApiDoc({
    summary: 'List Facebook Pages',
  })
  @Post('plat/meta/facebook/pages')
  async getAuthInfo(@Body() data: UserIdDto) {
    return await this.metaService.getFacebookPageList(data.userId)
  }

  // @NatsMessagePattern('plat.meta.facebook.pages.selection')
  @ApiDoc({
    summary: 'Select Facebook Pages',
  })
  @Post('plat/meta/facebook/pages/selection')
  async selectFacebookPages(@Body() data: PagesSelectionDto) {
    return await this.metaService.selectFacebookPages(data.userId, data.pageIds)
  }

  // restFul API for get oauth authorize URL
  @ApiDoc({
    summary: 'Get Authorization URL (REST)',
  })
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
  @ApiDoc({
    summary: 'Handle OAuth Callback (REST)',
  })
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
  @ApiDoc({
    summary: 'Create Account and Set Access Token',
  })
  @Post('plat/meta/createAccountAndSetAccessToken')
  async postOAuth2Callback(@Body() data: CreateAccountAndSetAccessTokenDto) {
    return await this.metaService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })
  }

  // @NatsMessagePattern('plat.meta.facebook.page.insights')
  @ApiDoc({
    summary: 'Get Facebook Page Insights',
  })
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
  @ApiDoc({
    summary: 'Get Facebook Post Insights',
  })
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
  @ApiDoc({
    summary: 'Get Facebook Published Posts',
  })
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
  @ApiDoc({
    summary: 'Get Instagram Account Info',
  })
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
  @ApiDoc({
    summary: 'Get Instagram Account Insights',
  })
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
  @ApiDoc({
    summary: 'Get Instagram Post Insights',
  })
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
  @ApiDoc({
    summary: 'Get Threads Account Insights',
  })
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
  @ApiDoc({
    summary: 'Get Threads Post Insights',
  })
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
  @ApiDoc({
    summary: 'Get Facebook Page Posts',
  })
  @Post('plat/meta/facebook/page/posts')
  async getFacebookPagePostsDetail(
    @Body() data: { accountId: string, query: FacebookPagePostRequest },
  ) {
    return await this.facebookService.getPagePosts(
      data.accountId,
      data.query,
    )
  }

  // @NatsMessagePattern('plat.meta.facebook.page.post.comments')
  @ApiDoc({
    summary: 'Get Facebook Post Comments',
  })
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
  @ApiDoc({
    summary: 'Get Instagram User Posts',
  })
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
  @ApiDoc({
    summary: 'Get Threads User Posts',
  })
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
  @ApiDoc({
    summary: 'Search Facebook Locations',
  })
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
  @ApiDoc({
    summary: 'Search Threads Locations',
  })
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
  @ApiDoc({
    summary: 'Get Meta Access Token Status',
  })
  @Post('plat/meta/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: { accountId: string, platform: string }) {
    return await this.metaService.getAccessTokenStatus(data.accountId, data.platform)
  }

  @ApiDoc({
    summary: 'Get Facebook Post Attachments',
  })
  @Post('facebook/posts/attachments')
  async getFacebookPostAttachments(
    @Body() data: { postId: string, accountId: string },
  ) {
    return await this.facebookService.fetchPostAttachments(data.accountId, data.postId)
  }

  @ApiDoc({
    summary: 'Delete Facebook Post',
  })
  @Delete('facebook/posts/:postId')
  async deleteFacebookPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.facebookService.deletePost(data.accountId, postId)
  }

  @ApiDoc({
    summary: 'Like Facebook Post',
  })
  @Post('facebook/posts/:postId/likes')
  async likeFacebookPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.facebookService.likePost(data.accountId, postId)
  }

  @ApiDoc({
    summary: 'Unlike Facebook Post',
  })
  @Delete('facebook/posts/:postId/likes')
  async unlikeFacebookPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.facebookService.unlikePost(data.accountId, postId)
  }

  @ApiDoc({
    summary: 'Delete Threads Post',
  })
  @Delete('threads/posts/:postId')
  async deleteThreadsPost(
    @Param('postId') postId: string,
    @Body() data: { accountId: string },
  ) {
    return await this.threadsService.deletePost(postId, data.accountId)
  }

  @ApiDoc({
    summary: 'Delete LinkedIn Post',
  })
  @Delete('linkedin/:accountId/posts/:postId')
  async deleteLinkedinPost(
    @Param('postId') postId: string,
    @Param('accountId') accountId: string,
  ) {
    return await this.linkedinService.deletePost(accountId, postId)
  }
}
