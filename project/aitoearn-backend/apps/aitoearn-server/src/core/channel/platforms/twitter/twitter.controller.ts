import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import {
  CreateAccountAndSetAccessTokenDto,
  GetAuthUrlDto,
  UserTimelineDto,
} from './twitter.dto'
import { TwitterService } from './twitter.service'

@ApiTags('Platform/Twitter')
@Controller('plat/twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  @ApiDoc({
    summary: 'Get Twitter OAuth URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('/auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    return await this.twitterService.generateAuthorizeURL({
      userId: token.id,
      scopes: data.scopes,
      spaceId: data.spaceId,
      callbackUrl: data.callbackUrl,
      callbackMethod: data.callbackMethod,
    })
  }

  @ApiDoc({
    summary: 'Get OAuth Task Status',
  })
  @Get('/auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const result = await this.twitterService.getOAuth2TaskInfo(taskId)
    if (!result) {
      return {
        state: taskId,
        status: 0,
      }
    }
    return result
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Twitter OAuth Callback',
    query: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Get('/auth/back')
  async createAccountAndSetAccessToken(
    @Query() data: CreateAccountAndSetAccessTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.twitterService.postOAuth2Callback(data.state, {
      code: data.code,
      state: data.state,
    })

    if (result.status === 1 && result.callbackUrl) {
      return res.render('auth/back', {
        ...result,
        autoPostCallback: true,
      })
    }

    return res.render('auth/back', result)
  }

  @Public()
  @ApiDoc({
    summary: 'Get User Info (Crawler)',
  })
  @Post('/user/info')
  async getUserInfo(@Body() data: { accountId: string }) {
    return await this.twitterService.getUserInfo(data.accountId)
  }

  @Public()
  @ApiDoc({
    summary: 'Get User Timeline (Crawler)',
    body: UserTimelineDto.schema,
  })
  @Post('/timeline')
  async getUserTimeline(@Body() data: UserTimelineDto) {
    return await this.twitterService.getUserTimeline(data.accountId, data.userId, data)
  }

  @Public()
  @ApiDoc({
    summary: 'Get User Posts (Crawler)',
    body: UserTimelineDto.schema,
  })
  @Post('/user/posts')
  async getUserPosts(@Body() data: UserTimelineDto) {
    return await this.twitterService.getUserPosts(data.accountId, data.userId, data)
  }
}
