/*
 * @Author: AI Assistant
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: AI Assistant
 * @Description: TikTok Platform NATS API
 */
import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class PlatTiktokNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取授权页面URL
   * @param userId 用户ID
   * @param scopes 权限范围
   * @returns
   */
  async getAuthUrl(userId: string, scopes?: string[]) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.tiktok.authUrl,
      {
        userId,
        scopes,
      },
    )

    return res
  }

  /**
   * 查询认证信息
   * @param taskId 任务ID
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.getAuthInfo,
      {
        taskId,
      },
    )

    return res
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @param code 授权码
   * @param state 状态码
   * @returns
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    code: string,
    state: string,
  ) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.createAccountAndSetAccessToken,
      {
        taskId,
        code,
        state,
      },
    )

    return res
  }

  /**
   * 刷新访问令牌
   * @param accountId 账号ID
   * @param refreshToken 刷新令牌
   * @returns
   */
  async refreshAccessToken(accountId: string, refreshToken: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.refreshAccessToken,
      {
        accountId,
        refreshToken,
      },
    )

    return res
  }

  /**
   * 撤销访问令牌
   * @param accountId 账号ID
   * @returns
   */
  async revokeAccessToken(accountId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.revokeAccessToken,
      {
        accountId,
      },
    )

    return res
  }

  /**
   * 获取创作者信息
   * @param accountId 账号ID
   * @returns
   */
  async getCreatorInfo(accountId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.getCreatorInfo,
      {
        accountId,
      },
    )

    return res
  }

  /**
   * 初始化视频发布
   * @param accountId 账号ID
   * @param postInfo 发布信息
   * @param sourceInfo 源信息
   * @returns
   */
  async initVideoPublish(accountId: string, postInfo: any, sourceInfo: any) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.initVideoPublish,
      {
        accountId,
        postInfo,
        sourceInfo,
      },
    )

    return res
  }

  /**
   * 初始化照片发布
   * @param accountId 账号ID
   * @param postMode 发布模式
   * @param postInfo 发布信息
   * @param sourceInfo 源信息
   * @returns
   */
  async initPhotoPublish(
    accountId: string,
    postMode: string,
    postInfo: any,
    sourceInfo: any,
  ) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.initPhotoPublish,
      {
        accountId,
        postMode,
        postInfo,
        sourceInfo,
      },
    )

    return res
  }

  /**
   * 查询发布状态
   * @param accountId 账号ID
   * @param publishId 发布ID
   * @returns
   */
  async getPublishStatus(accountId: string, publishId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.getPublishStatus,
      {
        accountId,
        publishId,
      },
    )

    return res
  }

  /**
   * 上传视频文件
   * @param uploadUrl 上传URL
   * @param videoBase64 视频Base64
   * @param contentType 内容类型
   * @returns
   */
  async uploadVideoFile(
    uploadUrl: string,
    videoBase64: string,
    contentType: string,
  ) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.uploadVideoFile,
      {
        uploadUrl,
        videoBase64,
        contentType,
      },
    )

    return res
  }

  /**
   * 处理TikTok Webhook事件
   * @param event Webhook事件数据
   * @returns
   */
  async handleWebhookEvent(event: any) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.tiktok.handleWebhookEvent,
      event,
    )

    return res
  }
}
