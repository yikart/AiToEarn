/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok Controller
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import {
  AccountIdDto,
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  GetPublishStatusDto,
  ListUserVideosDto,
  PhotoPublishDto,
  RefreshTokenDto,
  RevokeTokenDto,
  UploadVideoFileDto,
  UserInfoDto,
  VideoPublishDto,
} from './dto/tiktok.dto'
import { TiktokService } from './tiktok.service'

@Controller()
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  // 获取页面的认证URL
  // @NatsMessagePattern('plat.tiktok.authUrl')
  @Post('plat/tiktok/authUrl')
  async getAuthUrl(@Body() data: GetAuthUrlDto) {
    return await this.tiktokService.getAuthUrl(data.userId, data.scopes, data.spaceId)
  }

  // 查询认证信息
  // @NatsMessagePattern('plat.tiktok.getAuthInfo')
  @Post('plat/tiktok/getAuthInfo')
  async getAuthInfo(@Body() data: GetAuthInfoDto) {
    return await this.tiktokService.getAuthInfo(data.taskId)
  }

  @Get('auth/url')
  async getOAuthAuthUri(@Query() query: GetAuthUrlDto) {
    return await this.tiktokService.getAuthUrl(query.userId, query.scopes)
  }

  // 获取AccessToken,并记录到用户，给平台回调用
  @Get('auth/back/:prefix/:taskId')
  async getAccessToken(
    @Param('prefix') prefix: string,
    @Param('taskId') taskId: string,
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    return await this.tiktokService.createAccountAndSetAccessToken(taskId, {
      code: query.code,
      state: query.state,
    })
  }

  @Get('auth/callback')
  async postOAuth2CallbackByRestFul(
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    return await this.tiktokService.createAccountAndSetAccessToken(query.state, {
      code: query.code,
      state: query.state,
    })
  }

  // 创建账号并设置授权Token
  // @NatsMessagePattern('plat.tiktok.createAccountAndSetAccessToken')
  @Post('plat/tiktok/createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Body() data: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.tiktokService.createAccountAndSetAccessToken(
      data.state,
      {
        code: data.code,
        state: data.state,
      },
    )
  }

  // 刷新访问令牌
  // @NatsMessagePattern('plat.tiktok.refreshAccessToken')
  @Post('plat/tiktok/refreshAccessToken')
  async refreshAccessToken(@Body() data: RefreshTokenDto) {
    return await this.tiktokService.refreshAccessToken(
      data.accountId,
      data.refreshToken,
    )
  }

  // 撤销访问令牌
  // @NatsMessagePattern('plat.tiktok.revokeAccessToken')
  @Post('plat/tiktok/revokeAccessToken')
  async revokeAccessToken(@Body() data: RevokeTokenDto) {
    return await this.tiktokService.revokeAccessToken(data.accountId)
  }

  // 获取创作者信息
  // @NatsMessagePattern('plat.tiktok.getCreatorInfo')
  @Post('plat/tiktok/getCreatorInfo')
  async getCreatorInfo(@Body() data: AccountIdDto) {
    return await this.tiktokService.getCreatorInfo(data.accountId)
  }

  // 初始化视频发布
  // @NatsMessagePattern('plat.tiktok.initVideoPublish')
  @Post('plat/tiktok/initVideoPublish')
  async initVideoPublish(@Body() data: VideoPublishDto) {
    return await this.tiktokService.initVideoPublish(
      data.accountId,
      data.postInfo,
      data.sourceInfo,
    )
  }

  // 初始化照片发布
  // @NatsMessagePattern('plat.tiktok.initPhotoPublish')
  @Post('plat/tiktok/initPhotoPublish')
  async initPhotoPublish(@Body() data: PhotoPublishDto) {
    return await this.tiktokService.initPhotoPublish(
      data.accountId,
      data.postMode,
      data.postInfo,
      data.sourceInfo,
    )
  }

  // 查询发布状态
  // @NatsMessagePattern('plat.tiktok.getPublishStatus')
  @Post('plat/tiktok/getPublishStatus')
  async getPublishStatus(@Body() data: GetPublishStatusDto) {
    return await this.tiktokService.getPublishStatus(
      data.accountId,
      data.publishId,
    )
  }

  // 上传视频文件
  // @NatsMessagePattern('plat.tiktok.uploadVideoFile')
  @Post('plat/tiktok/uploadVideoFile')
  async uploadVideoFile(@Body() data: UploadVideoFileDto) {
    return await this.tiktokService.uploadVideoFile(
      data.uploadUrl,
      data.videoBase64,
      data.contentType,
    )
  }

  @Post('publish')
  async publish(
    @Body() data: { videoUrl: string, accountId: string },
  ) {
    return await this.tiktokService.publishVideoViaURL(data.accountId, data.videoUrl)
  }

  // @NatsMessagePattern('plat.tiktok.user.info')
  @Post('plat/tiktok/user/info')
  async getUserInfo(@Body() data: UserInfoDto) {
    return await this.tiktokService.getUserInfo(data.accountId, data.fields)
  }

  // @NatsMessagePattern('plat.tiktok.user.videos')
  @Post('plat/tiktok/user/videos')
  async listUserVideos(@Body() data: ListUserVideosDto) {
    return await this.tiktokService.getUserVideos(
      data.accountId,
      data.fields,
      data.cursor,
      data.max_count,
    )
  }

  // @NatsMessagePattern('plat.tiktok.accessTokenStatus')
  @Post('plat/tiktok/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.tiktokService.getAccessTokenStatus(data.accountId)
  }
}
