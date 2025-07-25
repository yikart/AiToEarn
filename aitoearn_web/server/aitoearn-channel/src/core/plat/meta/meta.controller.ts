import { Controller, Get, Param, Query } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { FacebookInsightsRequest, FacebookPublishedPostRequest } from '@/libs/facebook/facebook.interfaces'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  UserIdDto,
} from './dto/meta.dto'
import { FacebookService } from './facebook.service'
import { MetaService } from './meta.service'

@Controller('meta')
export class MetaController {
  constructor(
    private readonly metaService: MetaService,
    private readonly facebookService: FacebookService,
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
    return await this.metaService.postOAuth2Callback(data.taskId, {
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
      data.pageId,
      data.query,
    )
  }

  @NatsMessagePattern('plat.meta.facebook.page.published_posts')
  async getFacebookPagePosts(
    @Payload() data: { userId: string; pageId: string; query: FacebookPublishedPostRequest },
  ) {
    return await this.facebookService.getPagePublishedPosts(
      data.userId,
      data.pageId,
      data.query,
    )
  }
}
