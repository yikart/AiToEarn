import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { Account } from '@yikart/mongodb'
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

@Injectable()
export class WxPlatService {
  private readonly logger = new Logger(WxPlatService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly myWxPlatApiService: MyWxPlatApiService,
    private readonly channelAccountService: ChannelAccountService,
  ) {}

  // 公众号token缓存key
  private getAuthAccessTokenCacheKey(accountId: string) {
    return `channel:wxPlat:authorizerAccessToken:${accountId}`
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
    this.logger.log(`创建授权任务: userId=${data.userId}, type=${data.type}, spaceId=${data.spaceId}`)

    if (!config.channel.wxPlat.id && config.relay) {
      this.logger.warn(`wxPlat.id 未配置且开启了 relay 模式，将转发到 relay 服务器`)
      throw new RelayAuthException()
    }

    const taskId = uuidv4()
    this.logger.log(`生成任务ID: ${taskId}`)

    const authUrl = await this.getAuthPageUrl(data.type, taskId)
    if (!authUrl) {
      this.logger.error(`获取授权页面链接失败: taskId=${taskId}`)
      throw new AppException(ResponseCode.ChannelPlatformTokenNotFound)
    }

    this.logger.log(`获取授权链接成功: ${authUrl}`)

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

    if (!rRes) {
      this.logger.error(`Redis 存储授权任务失败: taskId=${taskId}`)
      throw new AppException(ResponseCode.ChannelAuthTaskFailed)
    }

    this.logger.log(`授权任务创建成功: taskId=${taskId}`)
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

  private async failAuthTask(
    cacheKey: string,
    taskInfo: AuthTaskInfo<WxPlatAuthInfo>,
    message: string,
  ) {
    taskInfo.status = -1
    taskInfo.error = message
    await this.redisService.setJson(cacheKey, taskInfo, 60 * 3)
    return { status: 0, message }
  }

  /**
   * 获取授权页面链接
   * @param type
   * @param stat
   * @returns
   */
  async getAuthPageUrl(type: 'h5' | 'pc', stat?: string): Promise<string> {
    this.logger.log(`获取授权页面链接: type=${type}, stat=${stat}`)

    const res = await this.myWxPlatApiService.getAuthPageUrl(type, stat)

    if (!res) {
      this.logger.error(`myWxPlatApiService.getAuthPageUrl 返回空值`)
      throw new AppException(ResponseCode.ChannelPlatformTokenNotFound)
    }

    if (!res.data) {
      this.logger.error(`授权链接数据为空: ${JSON.stringify(res)}`)
      throw new AppException(ResponseCode.ChannelPlatformTokenNotFound)
    }

    this.logger.log(`授权页面链接获取成功: ${res.data}`)
    return res.data
  }

  /**
   * 检查
   * @param accountId
   * @returns
   */
  async checkAuth(accountId: string): Promise<{
    status: 0 | 1
    timeout?: number // 秒
  }> {
    const account = await this.channelAccountService.getAccountInfo(accountId)
    if (!account) {
      return {
        status: 0,
      }
    }

    // 尝试获取 access token，如果失败则说明授权失效
    const tokenInfo = await this.getAuthorizerAccessToken(account)
    if (!tokenInfo) {
      return {
        status: 0,
      }
    }

    return {
      status: 1,
    }
  }

  /**
   * (通过授权页面)设置用户的授权配置并创建账号
   * @param taskId
   * @param authData
   * @param authData.authCode
   * @param authData.expiresIn
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authData: { authCode: string, expiresIn: number },
  ) {
    try {
      const cacheKey = ChannelRedisKeys.authTask('wx_gzh', taskId)
      const taskInfo = await this.redisService.getJson<AuthTaskInfo<WxPlatAuthInfo>>(
        cacheKey,
      )
      if (!taskInfo || !taskInfo.data)
        return { status: 0, message: '任务不存在或已完成' }
      if (taskInfo.status === 1)
        return this.failAuthTask(cacheKey, taskInfo, '任务已完成')

      // 计算是否超时
      if (Date.now() - taskInfo.data.createTime > authData.expiresIn * 1000) {
        void this.redisService.del(cacheKey)
        return { status: 0, message: '任务已超时' }
      }

      // 延长授权时间
      void this.redisService.expire(cacheKey, 60 * 3)

      // 根据授权码获取授权信息
      const auth = await this.myWxPlatApiService.getQueryAuth(authData.authCode)
      if (!auth) {
        return this.failAuthTask(cacheKey, taskInfo, '获取授权信缓存失败')
      }
      const { authorizer_appid } = auth

      const authInfo = await this.myWxPlatApiService.getAuthorizerInfo(authorizer_appid)
      if (!authInfo)
        return this.failAuthTask(cacheKey, taskInfo, '获取授权信息失败')

      // https://developers.weixin.qq.com/doc/oplatform/openApi/authorization-management/api_getauthorizerinfo.html#Enum_Res__authorizer_info__service_type_info__id
      const { service_type_info, verify_type_info } = authInfo
      if (![0, 1, 2].includes(service_type_info.id)) {
        return this.failAuthTask(cacheKey, taskInfo, '不支持的公众号类型')
      }
      if (verify_type_info.id !== 0)
        return this.failAuthTask(cacheKey, taskInfo, '不支持的服务类型')

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
        loginCookie: auth.authorizer_refresh_token,
      })

      const accountInfo = await this.channelAccountService.createAccount(
        {
          type: AccountType.WxGzh,
          uid: authorizer_appid,
        },
        newData,
      )
      if (!accountInfo)
        return this.failAuthTask(cacheKey, taskInfo, '添加账号失败')

      // 删除缓存的授权token
      await this.redisService.del(this.getAuthAccessTokenCacheKey(accountInfo.id))

      // 更新任务信息
      taskInfo.status = 1
      taskInfo.data.accountId = accountInfo.id

      const res = await this.redisService.setJson(
        cacheKey,
        taskInfo,
        60 * 5,
      )
      if (!res)
        return this.failAuthTask(cacheKey, taskInfo, '更新任务信息失败')

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
      this.logger.error(error, 'createAccountAndSetAccessToken error')
      return { status: 0, message: `添加账号失败: ${(error as Error).message}` }
    }
  }

  /**
   * 获取授权方接口调用凭据
   * @param accountInfo
   */
  async getAuthorizerAccessToken(accountInfo: Account) {
    try {
      const info = await this.redisService.getJson<WxPlatAuthorizerInfo>(
        this.getAuthAccessTokenCacheKey(accountInfo.id),
      )

      if (info) {
        return info
      }

      const newInfo = await this.myWxPlatApiService.getStableAuthorizerAccessToken(
        accountInfo.uid,
        accountInfo.loginCookie,
      )

      await this.redisService.setJson(
        this.getAuthAccessTokenCacheKey(accountInfo.id),
        newInfo,
        newInfo.expires_in - 60 * 10,
      )

      return newInfo
    }
    catch (error) {
      this.logger.fatal(error)
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
    resolvedUrl?: string
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
