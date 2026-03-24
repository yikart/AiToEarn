import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { WxPlatAuthorizerInfo } from '../../libs/my-wx-plat/comment'
import { MyWxPlatApiService } from '../../libs/my-wx-plat/my-wx-plat.service'
import { ChannelAccountService } from '../channel-account.service'
import { AuthTaskInfo } from '../common'
import { WxPlatAuthInfo } from './common'
import { decode } from './wx-msg-crypto'

@Injectable()
export class WxPlatService {
  private encodingAESKey = ''
  private readonly logger = new Logger(WxPlatService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly myWxPlatApiService: MyWxPlatApiService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    this.encodingAESKey = config.channel.wxPlat.encodingAESKey
  }

  // 公众号token缓存key
  private getAuthAccessTokenCacheKey(accountId: string) {
    return `channel:wxPlat:authorizerAccessToken:${accountId}`
  }

  // 公众号token缓存key
  private getAuthRefreshTokenCacheKey(accountId: string) {
    return `channel:wxPlat:authorizerRefreshToken:${accountId}`
  }

  decryptWXData(data: string) {
    return decode(data, this.encodingAESKey)
  }

  /**
   * 创建用户授权任务
   */
  async createAuthTask(
    data: {
      userId: string
      type: 'h5' | 'pc'
      spaceId: string
      callbackUrl?: string
      callbackMethod?: 'GET' | 'POST'
    },
    options?: {
      transpond?: string
      accountAddPath?: string
    },
  ) {
    if (!config.channel.wxPlat.id && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidv4()

    const authUrl = await this.getAuthPageUrl(data.type, taskId)
    if (!authUrl)
      throw new AppException(ResponseCode.ChannelPlatformTokenNotFound)

    const rRes = await this.redisService.setJson(
      ChannelRedisKeys.authTask('wx_gzh', taskId),
      {
        taskId,
        spaceId: data.spaceId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          createTime: Date.now(),
          userId: data.userId,
        },
        status: 0,
        callbackUrl: data.callbackUrl,
        callbackMethod: data.callbackMethod,
      },
      60 * 5,
    )

    if (!rRes)
      throw new AppException(ResponseCode.ChannelAuthTaskFailed)

    return {
      url: authUrl,
      taskId,
    }
  }

  // 获取授权任务信息
  async getAuthTaskInfo(taskId: string) {
    const taskInfo = await this.redisService.getJson<AuthTaskInfo<WxPlatAuthInfo>>(
      ChannelRedisKeys.authTask('wx_gzh', taskId),
    )

    return taskInfo
  }

  /**
   * 获取授权页面链接
   * @param type
   * @param stat
   * @returns
   */
  async getAuthPageUrl(type: 'h5' | 'pc', stat?: string): Promise<string> {
    const res = await this.myWxPlatApiService.getAuthPageUrl(type, stat)
    if (!res)
      throw new AppException(ResponseCode.ChannelPlatformTokenNotFound)

    return res.data
  }

  async checkAuth(accountId: string): Promise<{
    status: 0 | 1
    timeout?: number // 秒
  }> {
    const refreshToken = await this.redisService.get(this.getAuthRefreshTokenCacheKey(accountId))
    if (!refreshToken) {
      return {
        status: 0,
      }
    }

    const timeout = await this.redisService.ttl(this.getAuthRefreshTokenCacheKey(accountId))
    return {
      status: 1,
      timeout: timeout / 1000,
    }
  }

  /**
   * (通过授权页面)设置用户的授权配置并创建账号
   * @param taskId
   * @param authData
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authData: { authCode: string, expiresIn: number },
  ) {
    try {
      const taskInfo = await this.redisService.getJson<AuthTaskInfo<WxPlatAuthInfo>>(
        ChannelRedisKeys.authTask('wx_gzh', taskId),
      )
      if (!taskInfo || !taskInfo.data)
        return { status: 0, message: '任务不存在或已完成' }
      if (taskInfo.status === 1)
        return { status: 0, message: '任务已完成' }

      // 计算是否超时
      if (Date.now() - taskInfo.data.createTime > authData.expiresIn * 1000) {
        void this.redisService.del(ChannelRedisKeys.authTask('wx_gzh', taskId))
        return { status: 0, message: '任务已超时' }
      }

      // 延长授权时间
      void this.redisService.expire(ChannelRedisKeys.authTask('wx_gzh', taskId), 60 * 3)

      // 根据授权码获取授权信息
      const auth = await this.myWxPlatApiService.getQueryAuth(authData.authCode)
      if (!auth) {
        void this.redisService.del(ChannelRedisKeys.authTask('wx_gzh', taskId))
        return { status: 0, message: '获取授权信缓存失败' }
      }
      const { authorizer_appid, expires_in } = auth

      const authInfo = await this.myWxPlatApiService.getAuthorizerInfo(authorizer_appid)
      if (!authInfo)
        return { status: 0, message: '获取授权信息失败' }

      // 创建本平台的平台账号
      const newData = new NewAccount({
        userId: taskInfo.data.userId,
        type: AccountType.WxGzh,
        uid: authorizer_appid,
        account: authInfo.user_name,
        avatar: authInfo.head_img,
        nickname: authInfo.nick_name,
        groupId: taskInfo.spaceId,
        status: AccountStatus.NORMAL,
      })

      const accountInfo = await this.channelAccountService.createAccount(
        {
          type: AccountType.WxGzh,
          uid: authorizer_appid,
        },
        newData,
      )
      if (!accountInfo)
        return { status: 0, message: '添加账号失败' }

      // 设置授权信息
      const setRes = await this.redisService.setJson(
        this.getAuthAccessTokenCacheKey(accountInfo.id),
        auth,
        expires_in,
      )

      // 设置29天的刷新令牌
      await this.redisService.setJson(
        this.getAuthRefreshTokenCacheKey(accountInfo.id),
        auth.authorizer_refresh_token,
        2592000,
      )

      if (!setRes)
        return { status: 0, message: '设置授权信息缓存失败' }

      // 更新任务信息
      taskInfo.status = 1
      taskInfo.data.accountId = accountInfo.id

      const res = await this.redisService.setJson(
        ChannelRedisKeys.authTask('wx_gzh', taskId),
        taskInfo,
        60 * 5,
      )
      if (!res)
        return { status: 0, message: '更新任务信息失败' }

      return {
        status: 1,
        message: '添加账号成功',
        accountId: accountInfo.id,
        callbackUrl: taskInfo.callbackUrl,
        callbackMethod: taskInfo.callbackMethod,
        taskId,
      }
    }
    catch (error) {
      this.logger.error('createAccountAndSetAccessToken error:', error)
      return { status: 0, message: `添加账号失败: ${(error as Error).message}` }
    }
  }

  /**
   * 获取授权方接口调用凭据
   * @param accountId
   */
  async getAuthorizerAccessToken(accountId: string) {
    const accountInfo = await this.channelAccountService.getAccountInfo(accountId)
    if (!accountInfo)
      throw new Error('账号不存在')

    try {
      const info = await this.redisService.getJson<WxPlatAuthorizerInfo>(
        this.getAuthAccessTokenCacheKey(accountId),
      )
      if (info) {
        // 快超时就重新获取
        const overTime = await this.redisService.ttl(
          this.getAuthAccessTokenCacheKey(accountId),
        )
        if (overTime < 60 * 10)
          return info

        const newInfo = await this.myWxPlatApiService.getAuthorizerAccessToken(
          info.authorizer_appid,
          info.authorizer_refresh_token,
        )
        if (!newInfo)
          throw new Error('获取授权方令牌失败')

        const res = await this.redisService.setJson(
          this.getAuthAccessTokenCacheKey(accountId),
          newInfo,
          newInfo.expires_in,
        )
        if (!res)
          throw new Error('设置授权方令牌缓存失败')

        return newInfo
      }

      // 没有值重新获取
      // 查看长期的刷新令牌
      const refreshToken = await this.redisService.get(
        this.getAuthRefreshTokenCacheKey(accountId),
      )

      if (!refreshToken)
        throw new Error('获取授权方刷新令牌失败')

      const newInfo = await this.myWxPlatApiService.getAuthorizerAccessToken(
        accountInfo.uid,
        refreshToken,
      )

      if (!newInfo)
        throw new Error('获取授权方令牌失败')
      return newInfo
    }
    catch (error) {
      this.logger.error(error)
      throw new AppException(ResponseCode.ChannelAuthTaskFailed)
    }
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const feedId = this.parseWxChannelsUrl(workLink)
    const resolvedDataId = feedId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析微信视频号 URL，提取 Feed ID
   * 支持的 URL 格式：
   * - https://channels.weixin.qq.com/web/pages/feed?feedId=FEED_ID
   * - https://channels.weixin.qq.com/web/pages/home?feedId=FEED_ID
   * - https://channels.weixin.qq.com/platform/post/create?feedId=FEED_ID
   * @param workLink 微信视频号链接
   * @returns feedId 或 null
   */
  private parseWxChannelsUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname

    if (hostname === 'channels.weixin.qq.com') {
      // 从查询参数获取 feedId
      const feedId = url.searchParams.get('feedId')
      if (feedId) {
        return feedId
      }

      // 从路径中提取 ID（某些分享链接可能使用路径形式）
      const pathname = url.pathname
      const pathMatch = pathname.match(/\/feed\/(\w+)/)
      if (pathMatch) {
        return pathMatch[1]
      }
    }

    return null
  }
}
