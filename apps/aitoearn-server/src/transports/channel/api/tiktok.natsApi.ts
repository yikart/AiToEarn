import { Injectable } from '@nestjs/common'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PlatTiktokNatsApi extends ChannelBaseApi {
  /**
   * 获取授权页面URL
   * @param userId 用户ID
   * @param scopes 权限范围
   * @param spaceId
   * @returns
   */
  async getAuthUrl(userId: string, scopes?: string[], spaceId?: string) {
    const res = await this.sendMessage<string>(
      `plat/tiktok/authUrl`,
      {
        userId,
        scopes,
        spaceId: spaceId || '',
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
    const res = await this.sendMessage<string>(
      `plat/tiktok/getAuthInfo`,
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
    code: string,
    state: string,
  ) {
    const res = await this.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      `plat/tiktok/createAccountAndSetAccessToken`,
      {
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/refreshAccessToken`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/revokeAccessToken`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/getCreatorInfo`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/initVideoPublish`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/initPhotoPublish`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/getPublishStatus`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/uploadVideoFile`,
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
    const res = await this.sendMessage<any>(
      `plat/tiktok/handleWebhookEvent`,
      event,
    )
    return res
  }
}
