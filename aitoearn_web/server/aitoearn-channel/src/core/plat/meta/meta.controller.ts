import { Controller, Get, Param, Post, Query } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { FacebookInsightsRequest, FacebookPublishedPostRequest } from '@/libs/facebook/facebook.interfaces'
import { InstagramInsightsRequest, InstagramMediaInsightsRequest } from '@/libs/instagram/instagram.interfaces'
import { ThreadsInsightsRequest } from '@/libs/threads/threads.interfaces'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  PagesSelectionDto,
  UserIdDto,
} from './dto/meta.dto'
import { FacebookService } from './facebook.service'
import { InstagramService } from './instagram.service'
import { MetaService } from './meta.service'
import { ThreadsService } from './threads.service'

@Controller('meta')
export class MetaController {
  constructor(
    private readonly metaService: MetaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly threadsService: ThreadsService,
  ) {}

  // generate authorization URL
  @NatsMessagePattern('plat.meta.authUrl')
  async generateAuthorizeURL(@Payload() data: GetAuthUrlDto) {
    return await this.metaService.generateAuthorizeURL(
      data.userId,
      data.platform,
    )
  }

  // check oauth task status
  @NatsMessagePattern('plat.meta.getAuthInfo')
  async getOAuth2TaskInfo(@Payload() data: GetAuthInfoDto) {
    return await this.metaService.getOAuth2TaskInfo(data.taskId)
  }

  @NatsMessagePattern('plat.meta.facebook.pages')
  @Get('facebook/pages')
  async getAuthInfo(@Payload() data: UserIdDto) {
    return await this.metaService.getFacebookPageList(data.userId)
  }

  @NatsMessagePattern('plat.meta.facebook.pages.selection')
  @Post('facebook/pages')
  async selectFacebookPages(@Payload() data: PagesSelectionDto) {
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
  @NatsMessagePattern('plat.meta.createAccountAndSetAccessToken')
  async postOAuth2Callback(@Payload() data: CreateAccountAndSetAccessTokenDto) {
    return await this.metaService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })
  }

  @NatsMessagePattern('plat.meta.facebook.page.insights')
  async getFacebookPageInsights(
    @Payload() data: { userId: string; pageId: string; query: FacebookInsightsRequest },
  ) {
    return await this.facebookService.getPageInsights(
      data.userId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.facebook.page.published_posts')
  async getFacebookPagePosts(
    @Payload() data: { userId: string; pageId: string; query: FacebookPublishedPostRequest },
  ) {
    return await this.facebookService.getPagePublishedPosts(
      data.userId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.instagram.account.insights')
  async getInstagramAccountInsights(
    @Payload() data: { accountId: string; query: InstagramInsightsRequest },
  ) {
    return await this.instagramService.getAccountInsights(
      data.accountId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.instagram.post.insights')
  async getInstagramPostInsights(
    @Payload() data: { accountId: string; postId: string; query: InstagramMediaInsightsRequest },
  ) {
    return await this.instagramService.getMediaInsights(
      data.accountId,
      data.postId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.threads.account.insights')
  async getThreadsAccountInsights(
    @Payload() data: { accountId: string; query: ThreadsInsightsRequest },
  ) {
    return await this.threadsService.getAccountInsights(
      data.accountId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.threads.post.insights')
  async getThreadsPostInsights(
    @Payload() data: { accountId: string; postId: string; query: ThreadsInsightsRequest },
  ) {
    return await this.threadsService.getMediaInsights(
      data.accountId,
      data.postId,
      data.query,
    )
  }
}
