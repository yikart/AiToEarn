/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok Controller
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
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

@ApiTags('OpenSource/Core/Platforms/Tiktok')
@Controller()
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  // 获取页面的认证URL
  // @NatsMessagePattern('plat.tiktok.authUrl')
  @ApiDoc({
    summary: 'Get TikTok Authorization URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('plat/tiktok/authUrl')
  async getAuthUrl(@Body() data: GetAuthUrlDto) {
    return await this.tiktokService.getAuthUrl(data.userId, data.scopes, data.spaceId)
  }

  // 查询认证信息
  // @NatsMessagePattern('plat.tiktok.getAuthInfo')
  @ApiDoc({
    summary: 'Get Authorization Task Info',
    body: GetAuthInfoDto.schema,
  })
  @Post('plat/tiktok/getAuthInfo')
  async getAuthInfo(@Body() data: GetAuthInfoDto) {
    return await this.tiktokService.getAuthInfo(data.taskId)
  }

  @ApiDoc({
    summary: 'Get Public Authorization URL',
  })
  @Get('auth/url')
  async getOAuthAuthUri(@Query() query: GetAuthUrlDto) {
    return await this.tiktokService.getAuthUrl(query.userId, query.scopes)
  }

  // 获取AccessToken,并记录到用户，给平台回调用
  @ApiDoc({
    summary: 'Handle Authorization Callback',
  })
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
    return await this.tiktokService.createAccountAndSetAccessToken(query.state, {
      code: query.code,
      state: query.state,
    })
  }

  // 创建账号并设置授权Token
  // @NatsMessagePattern('plat.tiktok.createAccountAndSetAccessToken')
  @ApiDoc({
    summary: 'Create Account and Set Access Token',
    body: CreateAccountAndSetAccessTokenDto.schema,
  })
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
  @ApiDoc({
    summary: 'Refresh Access Token',
    body: RefreshTokenDto.schema,
  })
  @Post('plat/tiktok/refreshAccessToken')
  async refreshAccessToken(@Body() data: RefreshTokenDto) {
    return await this.tiktokService.refreshAccessToken(
      data.accountId,
      data.refreshToken,
    )
  }

  // 撤销访问令牌
  // @NatsMessagePattern('plat.tiktok.revokeAccessToken')
  @ApiDoc({
    summary: 'Revoke Access Token',
    body: RevokeTokenDto.schema,
  })
  @Post('plat/tiktok/revokeAccessToken')
  async revokeAccessToken(@Body() data: RevokeTokenDto) {
    return await this.tiktokService.revokeAccessToken(data.accountId)
  }

  // 获取创作者信息
  // @NatsMessagePattern('plat.tiktok.getCreatorInfo')
  @ApiDoc({
    summary: 'Get Creator Information',
    body: AccountIdDto.schema,
  })
  @Post('plat/tiktok/getCreatorInfo')
  async getCreatorInfo(@Body() data: AccountIdDto) {
    return await this.tiktokService.getCreatorInfo(data.accountId)
  }

  // 初始化视频发布
  // @NatsMessagePattern('plat.tiktok.initVideoPublish')
  @ApiDoc({
    summary: 'Initialize Video Publish',
    body: VideoPublishDto.schema,
  })
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
  @ApiDoc({
    summary: 'Initialize Photo Publish',
    body: PhotoPublishDto.schema,
  })
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
  @ApiDoc({
    summary: 'Get Publish Status',
    body: GetPublishStatusDto.schema,
  })
  @Post('plat/tiktok/getPublishStatus')
  async getPublishStatus(@Body() data: GetPublishStatusDto) {
    return await this.tiktokService.getPublishStatus(
      data.accountId,
      data.publishId,
    )
  }

  // 上传视频文件
  // @NatsMessagePattern('plat.tiktok.uploadVideoFile')
  @ApiDoc({
    summary: 'Upload Video File',
    body: UploadVideoFileDto.schema,
  })
  @Post('plat/tiktok/uploadVideoFile')
  async uploadVideoFile(@Body() data: UploadVideoFileDto) {
    return await this.tiktokService.uploadVideoFile(
      data.uploadUrl,
      data.videoBase64,
      data.contentType,
    )
  }

  @ApiDoc({
    summary: 'Publish Video via URL',
  })
  @Post('publish')
  async publish(
    @Body() data: { videoUrl: string, accountId: string },
  ) {
    return await this.tiktokService.publishVideoViaURL(data.accountId, data.videoUrl)
  }

  // @NatsMessagePattern('plat.tiktok.user.info')
  @ApiDoc({
    summary: 'Get User Info',
    body: UserInfoDto.schema,
  })
  @Post('plat/tiktok/user/info')
  async getUserInfo(@Body() data: UserInfoDto) {
    return await this.tiktokService.getUserInfo(data.accountId, data.fields)
  }

  // @NatsMessagePattern('plat.tiktok.user.videos')
  @ApiDoc({
    summary: 'List User Videos',
    body: ListUserVideosDto.schema,
  })
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
  @ApiDoc({
    summary: 'Get Access Token Status',
    body: AccountIdDto.schema,
  })
  @Post('plat/tiktok/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.tiktokService.getAccessTokenStatus(data.accountId)
  }
}
