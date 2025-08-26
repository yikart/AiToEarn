/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok Controller
 */
import { Controller, Get, Param, Query } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import {
  AccountIdDto,
  CreateAccountAndSetAccessTokenDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  GetPublishStatusDto,
  PhotoPublishDto,
  RefreshTokenDto,
  RevokeTokenDto,
  UploadVideoFileDto,
  VideoPublishDto,
} from './dto/tiktok.dto'
import { TiktokService } from './tiktok.service'

@Controller('tiktok')
export class TiktokController {
  constructor(private readonly tiktokService: TiktokService) {}

  // 获取页面的认证URL
  @NatsMessagePattern('plat.tiktok.authUrl')
  async getAuthUrl(@Payload() data: GetAuthUrlDto) {
    return await this.tiktokService.getAuthUrl(data.userId, data.scopes)
  }

  // 查询认证信息
  @NatsMessagePattern('plat.tiktok.getAuthInfo')
  async getAuthInfo(@Payload() data: GetAuthInfoDto) {
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
  @NatsMessagePattern('plat.tiktok.createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Payload() data: CreateAccountAndSetAccessTokenDto,
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
  @NatsMessagePattern('plat.tiktok.refreshAccessToken')
  async refreshAccessToken(@Payload() data: RefreshTokenDto) {
    return await this.tiktokService.refreshAccessToken(
      data.accountId,
      data.refreshToken,
    )
  }

  // 撤销访问令牌
  @NatsMessagePattern('plat.tiktok.revokeAccessToken')
  async revokeAccessToken(@Payload() data: RevokeTokenDto) {
    return await this.tiktokService.revokeAccessToken(data.accountId)
  }

  // 获取创作者信息
  @NatsMessagePattern('plat.tiktok.getCreatorInfo')
  async getCreatorInfo(@Payload() data: AccountIdDto) {
    return await this.tiktokService.getCreatorInfo(data.accountId)
  }

  // 初始化视频发布
  @NatsMessagePattern('plat.tiktok.initVideoPublish')
  async initVideoPublish(@Payload() data: VideoPublishDto) {
    return await this.tiktokService.initVideoPublish(
      data.accountId,
      data.postInfo,
      data.sourceInfo,
    )
  }

  // 初始化照片发布
  @NatsMessagePattern('plat.tiktok.initPhotoPublish')
  async initPhotoPublish(@Payload() data: PhotoPublishDto) {
    return await this.tiktokService.initPhotoPublish(
      data.accountId,
      data.postMode,
      data.postInfo,
      data.sourceInfo,
    )
  }

  // 查询发布状态
  @NatsMessagePattern('plat.tiktok.getPublishStatus')
  async getPublishStatus(@Payload() data: GetPublishStatusDto) {
    return await this.tiktokService.getPublishStatus(
      data.accountId,
      data.publishId,
    )
  }

  // 上传视频文件
  @NatsMessagePattern('plat.tiktok.uploadVideoFile')
  async uploadVideoFile(@Payload() data: UploadVideoFileDto) {
    return await this.tiktokService.uploadVideoFile(
      data.uploadUrl,
      data.videoBase64,
      data.contentType,
    )
  }
}
