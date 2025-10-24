import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  UserTimelineDto,
} from './dto/twitter.dto'
import { TwitterService } from './twitter.service'

@Controller()
export class TwitterController {
  private readonly logger = new Logger(TwitterController.name)
  constructor(private readonly twitterService: TwitterService) { }

  // generate authorization URL
  // @NatsMessagePattern('plat.twitter.authUrl')
  @Post('plat/twitter/authUrl')
  async generateAuthorizeURL(@Body() data: GetAuthUrlDto) {
    return await this.twitterService.generateAuthorizeURL(
      data.userId,
      data.scopes,
      data.spaceId,
    )
  }

  // check oauth task status
  // @NatsMessagePattern('plat.twitter.getAuthInfo')
  @Post('plat/twitter/getAuthInfo')
  async getOAuth2TaskInfo(@Body() data: GetAuthInfoDto) {
    const result = await this.twitterService.getOAuth2TaskInfo(data.taskId)
    if (!result) {
      this.logger.warn(`OAuth2 task not found for state: ${data.taskId}`)
      return {
        state: data.taskId,
        status: 0,
      }
    }
    return result
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
  // @NatsMessagePattern('plat.twitter.createAccountAndSetAccessToken')
  @Post('plat/twitter/createAccountAndSetAccessToken')
  async postOAuth2Callback(@Body() data: CreateAccountAndSetAccessTokenDto) {
    return await this.twitterService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })
  }

  // @NatsMessagePattern('plat.twitter.user.info')
  @Post('plat/twitter/user/info')
  async getUserInfo(@Body() data: { accountId: string }) {
    return await this.twitterService.getUserInfo(data.accountId)
  }

  // @NatsMessagePattern('plat.twitter.timeline')
  @Post('plat/twitter/timeline')
  async getUserTimeline(@Body() data: UserTimelineDto) {
    return await this.twitterService.getUserTimeline(data.accountId, data.userId, data)
  }

  // @NatsMessagePattern('plat.twitter.user.posts')
  @Post('plat/twitter/user/posts')
  async getUserPosts(@Body() data: UserTimelineDto) {
    return await this.twitterService.getUserPosts(data.accountId, data.userId, data)
  }

  // @NatsMessagePattern('plat.twitter.tweet.detail')
  @Post('plat/twitter/tweet/detail')
  async getTweetDetail(@Body() data: { userId, tweetId: string }) {
    return await this.twitterService.getTweetDetail(data.userId, data.tweetId)
  }

  // @NatsMessagePattern('plat.twitter.tweet.repost')
  @Post('plat/twitter/tweet/repost')
  async repostTweet(@Body() data: { userId, tweetId: string }) {
    return await this.twitterService.repost(data.userId, data.tweetId)
  }

  // @NatsMessagePattern('plat.twitter.tweet.like')
  @Post('plat/twitter/tweet/like')
  async likeTweet(@Body() data: { userId, tweetId: string }) {
    return await this.twitterService.likePost(data.userId, data.tweetId)
  }

  // @NatsMessagePattern('plat.twitter.tweet.unlike')
  @Post('plat/twitter/tweet/unlike')
  async unlikeTweet(@Body() data: { userId, tweetId: string }) {
    return await this.twitterService.unlikePost(data.userId, data.tweetId)
  }

  @Delete(':accountId/tweets/:tweetId')
  async deleteTweet(@Param('tweetId') tweetId: string, @Param('accountId') accountId: string) {
    return await this.twitterService.deletePost(accountId, tweetId)
  }

  // @NatsMessagePattern('plat.twitter.tweet.reply')
  @Post('plat/twitter/tweet/reply')
  async replyTweet(@Body() data: { userId, tweetId, text: string }) {
    return await this.twitterService.replyPost(data.userId, data.tweetId, data.text)
  }

  // @NatsMessagePattern('plat.twitter.tweet.quote')
  @Post('plat/twitter/tweet/quote')
  async quoteTweet(@Body() data: { userId, tweetId, text: string }) {
    return await this.twitterService.quotePost(data.userId, data.tweetId, data.text)
  }
}
