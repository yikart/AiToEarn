import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
} from './dto/twitter.dto'
import { TwitterService } from './twitter.service'

@Controller('twitter')
export class TwitterController {
  private readonly logger = new Logger(TwitterController.name)
  constructor(private readonly twitterService: TwitterService) {}

  // generate authorization URL
  @NatsMessagePattern('plat.twitter.authUrl')
  async generateAuthorizeURL(@Payload() data: GetAuthUrlDto) {
    return await this.twitterService.generateAuthorizeURL(
      data.userId,
      data.scopes,
    )
  }

  // check oauth task status
  @NatsMessagePattern('plat.twitter.getAuthInfo')
  async getOAuth2TaskInfo(@Payload() data: GetAuthInfoDto) {
    return await this.twitterService.getOAuth2TaskInfo(data.taskId)
  }

  // restFul API for get oauth authorize URL
  @Get('oauth2/authorize_url')
  async getOAuthAuthUri(
    @Query()
    query: {
      userId: string
      scopes?: string[]
    },
  ) {
    return await this.twitterService.generateAuthorizeURL(
      query.userId,
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
    const result = await this.twitterService.postOAuth2Callback(query.state, {
      code: query.code,
      state: query.state,
    })
    this.logger.error('postOAuth2CallbackByRestFul result:', result)
    return result
  }

  @Post('publish')
  async publishPost(
    @Body() data: { imgUrlList: string[], videoUrl: string, desc: string, accountId: string },
  ) {
    return await this.twitterService.publishPost(data.accountId, data.imgUrlList, data.videoUrl, data.desc)
  }

  // NATS message pattern for post oauth callback
  // get access token and create account
  @NatsMessagePattern('plat.twitter.createAccountAndSetAccessToken')
  async postOAuth2Callback(@Payload() data: CreateAccountAndSetAccessTokenDto) {
    return await this.twitterService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })
  }

  @NatsMessagePattern('plat.twitter.tweet.detail')
  async getTweetDetail(@Payload() data: { userId, tweetId: string }) {
    return await this.twitterService.getTweetDetail(data.userId, data.tweetId)
  }

  @NatsMessagePattern('plat.twitter.tweet.repost')
  async repostTweet(@Payload() data: { userId, tweetId: string }) {
    return await this.twitterService.repost(data.userId, data.tweetId)
  }

  @NatsMessagePattern('plat.twitter.tweet.like')
  async likeTweet(@Payload() data: { userId, tweetId: string }) {
    return await this.twitterService.likePost(data.userId, data.tweetId)
  }

  @NatsMessagePattern('plat.twitter.tweet.unlike')
  async unlikeTweet(@Payload() data: { userId, tweetId: string }) {
    return await this.twitterService.unlikePost(data.userId, data.tweetId)
  }

  @NatsMessagePattern('plat.twitter.tweet.delete')
  async deleteTweet(@Payload() data: { userId, tweetId: string }) {
    return await this.twitterService.deletePost(data.userId, data.tweetId)
  }

  @NatsMessagePattern('plat.twitter.tweet.reply')
  async replyTweet(@Payload() data: { userId, tweetId, text: string }) {
    return await this.twitterService.replyPost(data.userId, data.tweetId, data.text)
  }

  @NatsMessagePattern('plat.twitter.tweet.quote')
  async quoteTweet(@Payload() data: { userId, tweetId, text: string }) {
    return await this.twitterService.quotePost(data.userId, data.tweetId, data.text)
  }
}
