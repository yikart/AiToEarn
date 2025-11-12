import { Readable } from 'node:stream'
/*
 * @Author: zhangwei
 * @Date: 2025-05-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

import { AccountStatus, AccountType, AitoearnServerClientService, NewAccount } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import axios from 'axios'
import { Auth, google } from 'googleapis'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../common'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { Account } from '../../../libs/database/schema/account.schema'
import {
  OAuth2Credential,
  TokenStatus,
} from '../../../libs/database/schema/oauth2Credential.schema'
import { YoutubeApiService } from '../../../libs/youtube/youtubeApi.service'

interface AuthTaskInfo {
  state: string
  userId: string
  mail: string
  status: 0 | 1
  accountId?: string
  avatar?: string
  nickname?: string
  uid?: string
  type?: string
  account?: string
  spaceId?: string
}

@Injectable()
export class YoutubeService {
  private youtubeClient = google.youtube('v3')
  private webClientSecret: string
  private webClientId: string
  private webRenderBaseUrl: string
  private oauth2Client: Auth.OAuth2Client
  private readonly platform = AccountType.YOUTUBE
  private readonly logger = new Logger(YoutubeService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly youtubeApiService: YoutubeApiService,
    private readonly accountService: AccountService,
    private readonly serverClient: AitoearnServerClientService,

    @InjectModel(OAuth2Credential.name)
    private OAuth2CredentialModel: Model<OAuth2Credential>,
  ) {
    this.webClientSecret = config.youtube.secret
    this.webClientId = config.youtube.id
    this.webRenderBaseUrl = config.youtube.authBackHost
    this.oauth2Client = new google.auth.OAuth2()
  }

  initializeYouTubeClient(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    this.youtubeClient = google.youtube({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * 创建账号+设置授权Token
   * @param taskId
   * @param data
   * @returns
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    data: { code: string, state: string },
  ) {
    const { code } = data

    const authTask = await this.redisService.getJson<AuthTaskInfo>(
      `youtube:authTask:${taskId}`,
    )

    if (!authTask || authTask?.state !== taskId) {
      this.logger.error(`无效的任务ID: ${taskId}`)
      return { status: 0, message: '无效的任务ID' }
    }
    try {
      // 使用授权码获取访问令牌和刷新令牌
      const params = new URLSearchParams({
        code,
        redirect_uri: `${this.webRenderBaseUrl}`,
        client_id: this.webClientId,
        grant_type: 'authorization_code',
        client_secret: this.webClientSecret,
      })

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      )
      const { access_token, refresh_token, expires_in, id_token }
        = response.data

      // 验证ID令牌以获取用户信息
      // const oauth2Client = new google.auth.OAuth2();
      // this.oauth2Client.setCredentials({ access_token });
      this.initializeYouTubeClient(access_token)
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: id_token,
        audience: this.webClientId,
      })

      const payload = ticket.getPayload()
      if (!payload) {
        throw new Error('Invalid ID token')
      }
      const googleId = payload.sub
      const email = payload.email || ''
      const userId = authTask.userId
      // console.log('-----userId:----', userId)
      // 获取YouTube频道信息，用于更新账号数据库
      const accountInfo = await this.updateYouTubeAccountInfo(
        userId,
        email,
        googleId,
        access_token,
        refresh_token,
        expires_in,
        authTask.spaceId,
      )

      // 缓存令牌
      let res = await this.redisService.setJson(
        `youtube:accessToken:${accountInfo.id}`,
        {
          access_token,
          refresh_token,
          expiresAt: getCurrentTimestamp() + expires_in,
        },
        expires_in,
      )

      // 查询AccountToken数据库里是否存在令牌，如果存在，且上面获得refresh_token 存在，且不为空或null，则更新
      // 如果不存在，则创建
      let accountToken = await this.OAuth2CredentialModel.findOne({
        platform: AccountType.YOUTUBE,
        accountId: googleId,
      })

      if (accountToken) {
        // 更新现有令牌
        if (refresh_token && refresh_token.trim() !== '') {
          accountToken.refreshToken = refresh_token
        }

        accountToken.accessTokenExpiresAt = getCurrentTimestamp() + expires_in
        accountToken.updatedAt = new Date()
        await accountToken.save()
      }
      else {
        // 创建新的令牌记录
        accountToken = await this.OAuth2CredentialModel.create({
          platform: AccountType.YOUTUBE,
          accountId: googleId,
          refreshToken: refresh_token,
          status: TokenStatus.NORMAL,
          createTime: new Date(),
          updateTime: new Date(),
          accessTokenExpiresAt: getCurrentTimestamp() + expires_in,
        })
      }

      // 更新任务信息
      authTask.status = 1
      authTask.accountId = accountInfo.id
      authTask.mail = email || ''
      res = await this.redisService.setJson(
        `youtube:authTask:${taskId}`,
        authTask,
        60 * 3,
      )

      // // 返回系统令牌
      this.logger.log('最终返回', res)
      if (!res)
        return { status: 0, message: '更新任务信息失败' }
      return { status: 1, message: '添加账号成功', accountId: accountInfo.id }

      // return results;
    }
    catch (error) {
      this.logger.log('处理授权码失败:', error)
      return { status: 0, message: `授权失败: ${error.message}` }
    }
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: any) {
    accessTokenInfo.expires_in = getCurrentTimestamp() + accessTokenInfo.expires_in
    const cached = await this.redisService.setJson(
      `youtube:accessToken:${accountId}`,
      accessTokenInfo,
    )
    const persistResult = await this.OAuth2CredentialModel.updateOne({
      accountId,
      platform: this.platform,
    }, {
      accessToken: accessTokenInfo.access_token,
      refreshToken: accessTokenInfo.refresh_token,
      accessTokenExpiresAt: accessTokenInfo.expires_in,
    }, {
      upsert: true,
    })
    const saved = cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
  }

  private async getOAuth2Credential(accountId: string): Promise<any | null> {
    let credential = await this.redisService.getJson<any>(
      `youtube:accessToken:${accountId}`,
    )
    this.logger.log(`getOAuth2Credential from redis: ${JSON.stringify(credential)}`)
    if (!credential || !credential.refresh_token) {
      const oauth2Credential = await this.OAuth2CredentialModel.findOne({
        accountId,
        platform: this.platform,
      })
      this.logger.log(`getOAuth2Credential from db: ${JSON.stringify(oauth2Credential)}`)
      if (!oauth2Credential) {
        return null
      }
      credential = {
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        refresh_expires_in: oauth2Credential.refreshTokenExpiresAt || 0,
      }
    }
    return credential
  }

  /**
   * 设置授权Token
   * @param taskId
   * @param data
   * @returns
   */
  async setAccessToken(taskId: string, code: string) {
    const authTaskState = await this.redisService.getJson<AuthTaskInfo>(
      `youtube:authTask:${taskId}`,
    )
    if (!authTaskState || authTaskState.state !== taskId)
      return null

    try {
      // 使用授权码获取访问令牌和刷新令牌
      const params = new URLSearchParams({
        code,
        redirect_uri: `${this.webRenderBaseUrl}`,
        client_id: this.webClientId,
        grant_type: 'authorization_code',
        client_secret: this.webClientSecret,
      })

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      )

      const accessTokenInfo = response.data
      const access_token = accessTokenInfo.access_token
      const refresh_token = accessTokenInfo.refresh_token
      const expires_in = accessTokenInfo.expires_in
      const id_token = accessTokenInfo.id_token
      this.logger.log(`Youtube OAuth2 response: ${JSON.stringify(response.data)}`)
      // 验证ID令牌以获取用户信息
      this.initializeYouTubeClient(access_token)
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: id_token,
        audience: this.webClientId,
      })

      const payload = ticket.getPayload()
      if (!payload) {
        throw new Error('Invalid ID token')
      }
      const googleId = payload.sub
      const email = payload.email || ''
      const userId = authTaskState.userId
      // 获取YouTube频道信息，用于更新账号数据库
      const accountInfo = await this.updateYouTubeAccountInfo(
        userId,
        email,
        googleId,
        access_token,
        refresh_token,
        expires_in,
        authTaskState.spaceId,
      )

      // 缓存令牌
      await this.saveOAuthCredential(accountInfo.id, accessTokenInfo)

      // 更新任务信息
      authTaskState.status = 1
      authTaskState.accountId = accountInfo.id
      authTaskState.avatar = accountInfo.avatar
      authTaskState.nickname = accountInfo.nickname
      authTaskState.mail = email
      authTaskState.uid = googleId
      authTaskState.type = 'youtube'
      authTaskState.account = accountInfo.id
      await this.redisService.setJson(
        `youtube:authTask:${taskId}`,
        authTaskState,
        60 * 3,
      )

      return {
        status: 1,
        message: '授权成功',
        accountId: accountInfo.id,
      }
    }
    catch (error) {
      this.logger.error(`处理授权码失败: ${error}`)
      return {
        status: 0,
        message: '处理授权码失败',
        accountId: error,
      }
    }
  }

  /**
   * 获取YouTube频道信息并更新账号数据库
   * @param userId 用户ID
   * @param googleId Google ID
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   */
  private async updateYouTubeAccountInfo(
    userId: string,
    email: string,
    googleId: string,
    accessToken: string,
    refreshToken: string,
    expires_in: number,
    spaceId?: string,
  ): Promise<Account> {
    try {
      let newAccount = email
      let newNickname = ''
      let newAvatar = ''
      let channelId = ''

      // 获取当前用户的YouTube频道信息
      const response = await this.youtubeClient.channels.list({
        part: ['snippet', 'statistics'],
        mine: true,
      })

      if (!response.data.items || response.data.items.length === 0) {
        this.logger.log(`无法获取YouTube频道信息，将从Google用户信息获取`)
        try {
          const responseGoogle = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          )

          const userInfoData = responseGoogle.data

          // 使用Google用户信息更新账号数据
          newAccount = googleId || userInfoData.email
          newNickname = userInfoData.name || ''
          newAvatar = userInfoData.picture || ''
          this.logger.log('成功获取Google用户信息:', userInfoData)
        }
        catch (error) {
          this.logger.error('获取Google用户信息失败:', error)
          newAccount = googleId
          newNickname = 'YouTube User'
        }
      }
      else {
        const channel = response.data.items[0]
        channelId = channel.id || ''
        newAccount = channel.id || ''
        newNickname = channel.snippet?.title || ''
        newAvatar = channel.snippet?.thumbnails?.default?.url || ''
        this.logger.log(`成功获取YouTube频道信息: ${channel.snippet?.title}`)
      }

      const channelInfo = new NewAccount({
        userId,
        type: AccountType.YOUTUBE,
        uid: googleId,
        channelId,
        account: newAccount,
        nickname: newNickname,
        avatar: newAvatar,
        refresh_token: refreshToken,
        groupId: spaceId,
        status: AccountStatus.NORMAL,
        loginTime: new Date(),
        lastStatsTime: new Date(),
      })
      const accountInfo = await this.accountService.createAccount(
        userId,
        {
          type: AccountType.YOUTUBE,
          uid: googleId,
        },
        channelInfo,
      )

      if (!accountInfo)
        throw new Error('创建账号失败')

      return accountInfo
    }
    catch (error) {
      this.logger.error('更新YouTube账号信息失败:', error, error.stack)
      throw new Error('更新YouTube账号信息失败')
    }
  }

  /**
   * 刷新AccessToken
   * @param accountId
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(
    accountId: string,
    refreshToken: string,
  ): Promise<string> {
    // console.log(accountId, refreshToken)
    const accessTokenInfo
      = await this.youtubeApiService.refreshAccessToken(refreshToken)
    if (!accessTokenInfo)
      return ''

    // youtube did not return refresh_token again, so we need to keep the old one
    if (!accessTokenInfo.refresh_token) {
      accessTokenInfo.refresh_token = refreshToken
    }
    const res = await this.saveOAuthCredential(accountId, accessTokenInfo)
    if (!res)
      return ''

    return accessTokenInfo.access_token
  }

  /**
   * 获取用户的Youtube访问令牌
   * @param accountId 账号ID
   * @returns 访问令牌
   */
  async getUserAccessToken(accountId: string) {
    this.logger.log(`getUserAccessToken accountId: ${accountId}`)

    const credential = await this.getOAuth2Credential(accountId)
    if (!credential || !credential.access_token) {
      this.logger.error(`youtube credential not found for accountId: ${accountId}`)
      throw new AppException(ResponseCode.ChannelCredentialNotFound, { channel: 'youtube', accountId })
    }

    const isTokenExpired = credential.expires_in <= getCurrentTimestamp()
    if (!isTokenExpired) {
      return credential.access_token as string
    }

    if (!credential.refresh_token) {
      this.logger.error(`refresh Token not found for accountId: ${accountId}`)
      throw new AppException(ResponseCode.ChannelRefreshTokenNotFound, { channel: 'youtube', accountId })
    }

    const isRefreshTokenExpired = credential.refresh_expires_in && credential.refresh_expires_in <= getCurrentTimestamp()
    if (isRefreshTokenExpired) {
      const errMsg = `youtube refresh Token expired for accountId: ${accountId}, expired at: ${credential.refresh_expires_in}, please re-authorize`
      this.logger.error(errMsg)
      throw new AppException(ResponseCode.ChannelRefreshTokenExpired, { channel: 'youtube', accountId, credential })
    }

    // 刷新并获取新令牌
    const accessToken = await this.refreshAccessToken(
      accountId,
      credential.refresh_token,
    )

    if (!accessToken) {
      this.logger.error(`refresh Token failed for accountId: ${accountId}`)
      throw new AppException(ResponseCode.ChannelRefreshTokenFailed, { accountId })
    }

    return accessToken
  }

  /**
   * 检查用户是否已授权YouTube
   * @param accountId 账号ID
   * @returns 是否已授权
   */
  async isAuthorized(accountId: string): Promise<boolean> {
    try {
      const accessToken = await this.getUserAccessToken(accountId)
      return !!accessToken
    }
    catch (error) {
      return error
    }
  }

  /**
   * 获取授权URL
   * @param userId
   * @param mail
   * @param type
   * @param prefix
   * @returns
   */
  async getAuthUrl(
    userId: string,
    mail: string,
    // type: 'h5' | 'pc',
    prefix?: string,
    spaceId?: string,
  ) {
    const state = uuidv4()
    // 指定YouTube特定的scope
    const youtubeScopes = [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    const stateData = {
      originalState: state, // 保留原始state值
      userId, // 添加token
      email: mail,
      prefix,
      spaceId,
    }

    // 将状态数据转换为JSON字符串并编码
    const encodedState = encodeURIComponent(JSON.stringify(stateData))

    const params = new URLSearchParams({
      scope: youtubeScopes.join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      response_type: 'code',
      state: encodedState,
      redirect_uri: `${this.webRenderBaseUrl}`,
      client_id: this.webClientId,
      prompt: 'consent', // 强制要求用户确认授权，以便我们能够获取refresh_token
      // login_hint: userId,
    })

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.search = params.toString()
    const rRes = await this.redisService.setJson(
      `youtube:authTask:${state}`,
      { state, status: 0, userId, mail, spaceId },
      60 * 5,
    )
    this.logger.log(`youtubeService getAuthUrl rRes: ${rRes}`)
    return rRes
      ? {
          url: authUrl.toString(),
          state,
          taskId: state,
        }
      : null
  }

  /**
   * 获取用户的授权信息
   * @param userId
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const data = await this.redisService.getJson<{
      state: string
      status: number
      accountId?: string
    }>(`youtube:authTask:${taskId}`)
    return data
  }

  /**
   * 获取视频类别列表。
   */
  async getVideoCategoriesList(
    accountId: string,
    id?: string,
    regionCode?: string,
  ) {
    this.logger.log(`youtubeService getVideoCategoriesList: ${accountId}, ${id}, ${regionCode}}`)
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed)
    }
    try {
      // this.logger.log(requestBody)
      const response = await this.youtubeClient.videoCategories.list({
        part: ['snippet'],
        ...(id && { id: [id] }),
        ...(regionCode && { regionCode }),
        auth: this.oauth2Client,
      })

      // this.logger.log(response.data)
      return response
    }
    catch (err) {
      this.logger.error(`The API returned an error: ${err}`)
      throw err
    }
  }

  /**
   * 获取视频列表。
   * @param id 视频ID
   * @param chart 图表类型
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 视频列表
   */
  async getVideosList(
    accountId: string,
    chart?: string,
    id?: string[],
    myRating?: boolean,
    maxResults?: number,
    pageToken?: string,
    // params: GetVideosListParams,
  ) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client,
      part: ['snippet', 'contentDetails', 'statistics', 'id', 'status', 'topicDetails'],
    }
    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id // 如果提供了 id, 使用 id
    }
    else if (chart) {
      if (chart === 'mostPopular') {
        requestParams.chart = chart
      }
    }
    else if (myRating !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (myRating) {
        requestParams.myRating = myRating // 请求当前登录用户的频道
      }
    }
    else if (maxResults) {
      requestParams.maxResults = maxResults // 如果提供了 handle, 使用 handle
    }
    else if (pageToken) {
      requestParams.pageToken = pageToken // 如果提供了 handle, 使用 handle
    }

    this.logger.log(requestParams)
    try {
      const response = await this.youtubeClient.videos.list(requestParams)
      // const response = await this.youtubeApiService.getVideosList(requestParams)
      return response
    }
    catch (err) {
      this.logger.error(`The API returned an error: ${err}`)
      return err
    }
  }

  /**
   * 上传视频（小于20M）。
   * @param file 视频文件
   * @param accountId 账号ID
   * @param title 标题
   * @param description 描述
   * @param keywords 关键词
   * @param categoryId 分类ID
   * @param privacyStatus 状态（公开？私密）
   * @returns 视频ID
   */
  async uploadVideo(
    accountId: string,
    fileBuffer: any,
    fileName: string,
    title: string,
    description: string,
    privacyStatus: string,
    keywords?: string,
    categoryId?: string,
    // publishAt?: string,
  ) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }
    try {
      // 确保fileBuffer是Buffer实例
      let bufferInstance: Buffer
      if (Buffer.isBuffer(fileBuffer)) {
        bufferInstance = fileBuffer
      }
      else if (
        fileBuffer.type === 'Buffer'
        && Array.isArray(fileBuffer.data)
      ) {
        // 从序列化的Buffer对象恢复
        bufferInstance = Buffer.from(fileBuffer.data)
      }
      else if (typeof fileBuffer === 'object') {
        // 尝试从普通对象恢复为Buffer
        bufferInstance = Buffer.from(Object.values(fileBuffer))
      }
      else {
        this.logger.log('无效的文件Buffer格式')
        return '无效的文件Buffer格式'
      }
      this.logger.log('文件大小:', bufferInstance.length, '字节')

      // 客户端已经在 ensureValidAccessToken 中初始化了

      try {
        const channelInfo = await this.youtubeClient.channels.list({
          part: ['snippet'],
          mine: true,
          auth: this.oauth2Client,
        })

        if (!channelInfo.data.items || channelInfo.data.items.length === 0) {
          this.logger.log('未检测到可用的 YouTube 频道，请先创建频道')
          return '未检测到可用的 YouTube 频道，请先创建频道'
        }

        // 可以上传
      }
      catch (err) {
        if (err.errors?.[0]?.reason === 'youtubeSignupRequired') {
          // console.log('当前账号未启用 YouTube，请先创建频道');
          // throw new Error('当前账号未启用 YouTube，请先创建频道');
          return '当前账号未启用 YouTube，请先创建频道'
        }
      }

      // 准备视频的元数据
      const fileStream = Readable.from(bufferInstance) // 使用转换后的Buffer创建可读流
      const fileSize = bufferInstance.length // 获取文件大小

      // 构造请求体
      const requestBody: any = {
        snippet: {
          title,
          description,
          // tags: keywords ? keywords.split(',') : [],
          tags: keywords || [],
          categoryId: categoryId || '22', // 默认 categoryId 为 '22'，如果没有指定
        },
        status: {
          privacyStatus, // 可以是 'public', 'private', 'unlisted'
        },
      }

      // if (publishAt) {
      //   requestBody.status.publishAt = publishAt // 如果提供了 publishAt 则使用 publishAt
      // }
      this.logger.log(requestBody)

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.videos.insert(
        {
          auth: this.oauth2Client,
          // part: 'snippet, status, id, contentDetails',
          part: ['snippet', 'status', 'id', 'contentDetails'],
          requestBody,
          media: {
            body: fileStream, // 上传的文件流
          },
        },
        {
          onUploadProgress: (e) => {
            const progress = Math.round((e.bytesRead / fileSize) * 100)
            this.logger.log(`Uploading... ${progress}%`)
          },
        },
      )

      // 返回上传的视频 ID
      if (response.data.id) {
        this.logger.log('Video uploaded successfully, video ID:', response.data)
        return response.data
      }
      else {
        this.logger.error('Video upload failed')
        return null
      }
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 初始化分片上传会话
   * @param accountId 账户ID
   * @param title 视频标题
   * @param description 视频描述
   * @param tags 视频标签
   * @param categoryId 视频分类
   * @param privacy 隐私设置
  //  * @param publishAt 发布时间
   */
  async initVideoUpload(
    accountId: string,
    title: string,
    description: string,
    tags: string[],
    licence = 'youtube',
    categoryId = '22',
    privacyStatus = 'private',
    notifySubscribers = false,
    embeddable = false,
    selfDeclaredMadeForKids = false,
    contentLength?: number,
  ) {
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    try {
      // 准备视频元数据
      const requestBody: {
        notifySubscribers: boolean
        snippet: {
          title: string
          description: string
          tags: string[]
          categoryId: string
        }
        status: {
          privacyStatus: string
          selfDeclaredMadeForKids: boolean
          licence: string
          embeddable: boolean
        }
      } = {
        notifySubscribers,
        snippet: {
          title,
          description,
          tags,
          categoryId,
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids,
          licence,
          embeddable,
        },
      }

      // if (publishAt) {
      //   requestBody.status.publishAt = publishAt
      // }

      // 正确的 resumable upload 初始化
      const url = 'https://www.googleapis.com/upload/youtube/v3/videos'

      // 构建请求头
      const headers: any = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*', // 使用具体的内容类型
      }

      // 如果提供了内容长度，添加对应头部
      if (contentLength && contentLength > 0) {
        headers['X-Upload-Content-Length'] = String(contentLength)
      }
      else {
        // 使用默认值（例如100MB）以确保请求能够通过
        headers['X-Upload-Content-Length'] = String(500 * 1024 * 1024) // 100MB
      }

      this.logger.log(`youtube upload init params: ${requestBody.snippet}`)
      this.logger.log(`youtube video length: ${contentLength}`)

      const response = await axios({
        method: 'post',
        url,
        params: {
          uploadType: 'resumable',
          part: 'snippet,status,contentDetails',
        },
        headers,
        data: requestBody,
      })

      this.logger.log('初始化上传响应成功:', {
        status: response.status,
        headers: response.headers,
      })

      // 返回上传令牌，即 Location 头
      // return {
      //   uploadToken: response.headers.location,
      //   videoId: null, // 初始化阶段通常没有 videoId
      // }
      return response.headers.location
    }
    catch (error) {
      this.logger.error(`Error initializing video upload: ${error.message}`)
      return false
    }
  }

  /**
   * 文件分片上传
   * @param accountId 账户ID
   * @param file 分片数据
   * @param uploadToken 上传令牌
   * @param partNumber 分片序号
   */
  async uploadVideoPart(
    accountId: string,
    file: Buffer,
    uploadToken: string,
    partNumber: number,
  ) {
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    try {
      const chunkSize = 5 * 1024 * 1024 // 每个分片1MB
      // 计算当前分片的字节范围  parNumber 是从1开始
      const contentLength = file.length
      const startByte = (partNumber - 1) * chunkSize
      const endByte = startByte + contentLength - 1

      this.logger.log(`Uploading part ${partNumber} with range: ${startByte}-${endByte}, contentLength: ${contentLength}`)
      // 发送分片上传请求
      const response = await axios.put(uploadToken, file, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': contentLength.toString(),
          'Content-Range': `bytes ${startByte}-${endByte}/*`, // 表示分片范围，*表示文件总大小未知
        },
      })
      // 将headers转换为普通对象，避免返回RawAxiosHeaders类型
      const plainHeaders = response.headers ? { ...response.headers } : {}
      this.logger.log('分片上传响应成功:', {
        status: response.status,
        headers: plainHeaders,
      })

      if (response.status === 200) {
        this.logger.log('分片上传完成')

        return response.status
      }
    }
    catch (error) {
      this.logger.log('Error uploading video part:', error.response.status, error.response.data)
      // console.error('Error uploading video part:', error.response);
      if (error.response && error.response.status === 308) {
        this.logger.log('分片上传成功')

        return error.response.status
      }
      // throw new OptRpcException(50001, `上传视频分片失败: ${error.message}`);
      return `上传视频分片失败: ${error.message}`
    }
  }

  /**
   * 完成视频上传
   * @param accountId 账户ID
   * @param uploadToken 上传令牌
   * @param totalSize 视频文件的总大小（字节）
   */
  async videoComplete(
    accountId: string,
    uploadToken: string,
    totalSize: number,
  ) {
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { accountId })

    try {
      // 对于YouTube，通常在最后一个分片上传完成后，上传就自动完成了
      // 但我们可以发送一个空的PUT请求，确认上传已完成
      const response = await axios.put(uploadToken, '', {
        headers: {
          'Content-Length': '0',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Range': `bytes */${totalSize}`, // 添加必要的Content-Range头部
        },
      })

      return response.data.id
    }
    catch (error) {
      this.logger.log('Error completing video upload:', error)
      // return `完成视频上传失败: ${error.message}`
      return false
    }
  }

  /**
   * 获取子评论列表。
   * @param parentId 父评论ID
   * @param id 评论ID
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 评论列表
   */
  async getCommentsList(
    accountId: string,
    parentId?: string,
    id?: string[],
    maxResults?: number,
    pageToken?: string,
  ) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client, // 使用授权的 access token
      part: ['id', 'snippet'],
      ...(id && { id }),
      ...(parentId && { id }),
      ...(maxResults && { maxResults }),
      ...(pageToken && { pageToken }),
    }

    try {
      const response = await this.youtubeClient.comments.list(requestParams)
      // const response = await this.youtubeApiService.getCommentsList(requestParams)
      return response
    }
    catch (error) {
      return error
    }
  }

  /**
   * 创建对现有评论的回复
   * @param accountId 账号ID
   * @param snippet 元数据
   * @returns 创建结果
   */
  async insertComment(accountId: string, parentId: string, textOriginal: string) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody = {
        snippet: {
          parentId,
          textOriginal,
        },
      }
      // this.logger.log(requestBody)
      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.comments.insert({
        auth: this.oauth2Client,
        part: ['snippet', 'id'],
        requestBody,
      })

      return response
    }
    catch (error) {
      this.logger.log('Error uploading video:', error)
      return error
    }
  }

  /**
   * 更新评论。
   * @param snippet 元数据
   * @returns 创建结果
   */
  async updateComment(accountId: string, id: string, textOriginal: string) {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      const response = await this.youtubeClient.comments.update({
        auth: this.oauth2Client,
        part: ['snippet', 'id'],
        requestBody: {
          snippet: {
            textOriginal,
          },
          id,
        },
      })

      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 设置一条或多条评论的审核状态。
   * @param accountId 账号ID
   * @param id 评论ID
   * @param moderationStatus 审核状态
   * @param banAuthor 是否禁止作者
   * @returns 设置结果
   */
  async setModerationStatusComments(
    accountId: string,
    id: string[],
    moderationStatus: string,
    banAuthor: boolean,
  ): Promise<any> {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 调用 YouTube API 上传视频
      const response
        = await this.youtubeClient.comments.setModerationStatus({
          auth: this.oauth2Client,
          id,
          moderationStatus, // heldForReview 等待管理员审核   published - 清除要公开显示的评论。 rejected - 不显示该评论
          banAuthor, // 自动拒绝评论作者撰写的任何其他评论 将作者加入黑名单,
        })
      // 返回上传的视频 ID
      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 删除评论
   * @param id 评论ID
   * @returns 删除结果
   */
  async deleteComment(accountId, id) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    try {
      const response = await this.youtubeClient.comments.delete({
        auth: this.oauth2Client,
        id,
      })
      this.logger.log('comment deleted:', response.data)
      return response
    }
    catch (error) {
      this.logger.error('Error deleting comment:', error)
      return error
    }
  }

  /**
   * 获取评论会话列表。
   */
  async getCommentThreadsList(
    accountId: string,
    allThreadsRelatedToChannelId?: string,
    id?: string[],
    videoId?: string,
    maxResults?: number,
    pageToken?: string,
    order?: string,
    searchTerms?: string,
  ) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client, // 使用授权的 access token
      part: 'id, snippet',
      ...(id && { id }), // id 已为 string[] 类型
      ...(allThreadsRelatedToChannelId && { allThreadsRelatedToChannelId }),
      ...(videoId && { videoId }),
      ...(order && { order }),
      ...(maxResults && { maxResults }),
      ...(pageToken && { pageToken }),
      ...(searchTerms && { searchTerms }),
    }

    // // 根据参数选择 `id` 或 `forUsername`
    // if (id) {
    //   requestParams.id = id // 如果提供了 id, 使用 id
    // }
    // else if (allThreadsRelatedToChannelId) {
    //   requestParams.allThreadsRelatedToChannelId = allThreadsRelatedToChannelId // 如果提供了 handle, 使用 handle
    // }
    // else if (maxResults) {
    //   requestParams.maxResults = maxResults // 如果提供了 handle, 使用 handle
    // }
    // else if (pageToken) {
    //   requestParams.pageToken = pageToken // 如果提供了 handle, 使用 handle
    // }
    // else if (videoId) {
    //   requestParams.videoId = videoId // 如果提供了 handle, 使用 handle
    // }
    // else if (order) {
    //   requestParams.order = order // 如果提供了 handle, 使用 handle
    // }
    // else if (searchTerms) {
    //   requestParams.searchTerms = searchTerms // 如果提供了 handle, 使用 handle
    // }

    try {
      const response
        = await this.youtubeClient.commentThreads.list(requestParams)
      const sections = response.data
      this.logger.log(sections)
      return response
    }
    catch (err) {
      this.logger.error(`The API returned an error: ${err}`)
      return err
    }
  }

  /**
   * 创建顶级评论
   */
  async insertCommentThreads(accountId, channelId, videoId, textOriginal) {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      const response = await this.youtubeClient.commentThreads.insert({
        auth: this.oauth2Client,
        part: ['snippet', 'id'],
        requestBody: {
          snippet: {
            channelId,
            videoId,
            topLevelComment: {
              snippet: {
                textOriginal,
              },
            },
          },
        },
      })

      return response
    }
    catch (error) {
      this.logger.log(error)
      return error
    }
  }

  /**
   * 对视频的点赞、踩。
   */
  async setVideosRate(accountId, videoId, rating) {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 调用 API 进行点赞或踩
      const response = await this.youtubeClient.videos.rate({
        auth: this.oauth2Client,
        id: videoId,
        rating, // like | dislike | none,
      })

      return response
    }
    catch (error) {
      this.logger.error('Error rating video:', error)
      // this.handleApiError(error);
      return error
    }
  }

  /**
   * 获取视频的点赞、踩。
   */
  async getVideosRating(accountId: string, videoIds: string[]) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client,
      id: videoIds,
    }

    try {
      const response
        = await this.youtubeClient.videos.getRating(requestParams)

      const infos = response.data
      this.logger.log(infos)
      return response
    }
    catch (err) {
      this.logger.error(err)
      return err
    }
  }

  /**
   * 删除视频
   */
  async deleteVideo(accountId: string, videoId: string) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    try {
      const response = await this.youtubeClient.videos.delete({
        auth: this.oauth2Client,
        id: videoId,
      })

      this.logger.log('Video deleted:', response.data)
      return response
    }
    catch (error) {
      this.logger.error('Error deleting video:', error)
      return error
    }
  }

  /**
   * 更新视频。
   */
  async updateVideo(accountId: string, videoId: string, snippet: any, status: any, recordingDetails: any) {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      const requestBody: any = {
        id: videoId,
        snippet,
        status,
        recordingDetails,
      }
      this.logger.log(requestBody)

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.videos.update(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id'],
          requestBody,
        },
      )
      this.logger.log('Playlist insert successfully:', response.data)

      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 创建播放列表。
   */
  async insertPlayList(accountId: string, snippet: any, status: any) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      // const requestBody = {
      //   snippet: {
      //     title: title,
      //     description: description
      //   },
      //   status: {
      //     privacyStatus: privacyStatus,  // 可以是 'public', 'private', 'unlisted'
      //   },
      // };
      const requestBody = {
        snippet,
        status,
      }

      // console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.playlists.insert(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id', 'contentDetails'],
          requestBody,
        },
      )
      // this.logger.log('Playlist insert successfully:', response.data)
      // 返回上传的视频 ID
      if (response.data) {
        this.logger.log('Playlist insert successfully:', response.data)
      }
      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 获取播放列表。
   */
  async getPlayList(accountId: string, channelId?: string, id?: string, mine?: boolean, maxResults?: number, pageToken?: string) {
    // 设置 OAuth2 客户端凭证
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client,
      part: ['snippet', 'contentDetails', 'id', 'status', 'topicDetails', 'player'],
      // id: ids
    }

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id // 如果提供了 id, 使用 id
    }
    else if (channelId) {
      requestParams.channelId = channelId // 如果提供了 handle, 使用 handle
    }
    else if (mine !== undefined) {
      // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
      if (mine) {
        requestParams.mine = true // 请求当前登录用户的频道
      }
    }
    else if (maxResults) {
      requestParams.maxResults = maxResults // 如果提供了 handle, 使用 handle
    }
    else if (pageToken) {
      requestParams.pageToken = pageToken // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeClient.playlists.list(requestParams)

      // const infos = response.data
      return response
    }
    catch (err) {
      this.logger.log(`The API returned an error: ${err}`)
      return err
    }
  }

  /**
   * 更新播放列表。
   */
  async updatePlayList(accountId: string, id: string, title: string, description?: string, privacyStatus?: string, podcastStatus?: string) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody: any = {
        id, // 必填
        snippet: {
          title,
          // description: description,
        }, // 类型断言
        status: {
          // privacyStatus: privacyStatus,
        }, // 类型断言
      }

      // 根据参数选择 `title`、`description`、`privacyStatus` 或 `podcastStatus`

      if (description) {
        requestBody.snippet.description = description // 如果提供了 id, 使用 id
      }

      if (privacyStatus || podcastStatus) {
        if (privacyStatus) {
          requestBody.status.privacyStatus = privacyStatus // 如果提供了 id, 使用 id
        }
        if (podcastStatus) {
          requestBody.status.podcastStatus = podcastStatus // 如果提供了 id, 使用 id
        }
      }
      this.logger.log(requestBody)

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.playlists.update(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id'],
          requestBody,
        },
      )

      // 返回上传的视频 ID
      if (response.data) {
        this.logger.log('Playlist insert successfully:', response.data)
        return response
      }
      else {
        return response
      }
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 删除播放列表
   */
  async deletePlaylist(accountId: string, playListId: string) {
    // 设置 OAuth2 客户端凭证
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    try {
      const response = await this.youtubeClient.playlists.delete({
        auth: this.oauth2Client,
        id: playListId,
      })
      this.logger.log('Video deleted:', response.data)
      return response
    }
    catch (error) {
      this.logger.error('Error deleting video:', error)
      return error
    }
  }

  /**
   * 将视频添加到播放列表中
   */
  async addVideoToPlaylist(accountId: string, snippet: any, contentDetails: any) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody = {
        snippet,
        contentDetails,
      }

      // console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.playlistItems.insert(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id', 'contentDetails'],
          requestBody,
        },
      )

      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 获取播放列表项。
   */
  async getPlayItemsList(accountId: string, id?: string, playlistId?: string, maxResults?: number, pageToken?: string, videoId?: string) {
    // 设置 OAuth2 客户端凭证
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client,
      part: ['snippet', 'contentDetails', 'id', 'status'],
      // id: ids
    }

    // 根据参数选择 `id` 或 `forUsername`
    if (id) {
      requestParams.id = id // 如果提供了 id, 使用 id
    }
    else if (playlistId) {
      requestParams.playlistId = playlistId // 如果提供了 handle, 使用 handle
    }
    else if (maxResults) {
      requestParams.maxResults = maxResults // 如果提供了 handle, 使用 handle
    }
    else if (pageToken) {
      requestParams.pageToken = pageToken // 如果提供了 handle, 使用 handle
    }
    else if (videoId) {
      requestParams.videoId = videoId // 如果提供了 handle, 使用 handle
    }

    try {
      const response = await this.youtubeClient.playlistItems.list(requestParams)

      // const infos = response.data
      // console.log(infos);
      return response
    }
    catch (err) {
      this.logger.log(`The API returned an error: ${err}`)
      return err
    }
  }

  /**
   * 插入播放列表项。
   */
  async insertPlayItems(accountId: string, playlistId: string, resourceId: string, position?: number, note?: string) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody: any = {
        snippet: {
          playlistId,
          resourceId,
        },
        contentDetails: {},
      }

      // 如果传递了 position，则添加到请求体
      if (position !== undefined) {
        requestBody.snippet.position = position
      }

      // 如果传递了 note，则添加到请求体
      if (note !== undefined) {
        requestBody.contentDetails.note = note
      }
      // console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.playlistItems.insert(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id', 'contentDetails'],
          requestBody,
        },
      )

      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 更新播放列表项。
   */
  async updatePlayItems(accountId: string, playlistItemsId: string, snippet: any, contentDetails: any) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      const requestBody: any = {
        id: playlistItemsId,
        snippet,
        contentDetails,
      }
      // console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.playlistItems.update(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'status', 'id'],
          requestBody,
        },
      )

      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 删除播放列表项
   */
  async deletePlayItems(accountId: string, playlistItemsId: string) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      const response = await this.youtubeClient.playlistItems.delete({
        auth: this.oauth2Client,
        id: playlistItemsId,
      })
      // console.log('Video deleted:', response.data);
      return response
    }
    catch (error) {
      this.logger.error('Error deleting video:', error)
      return error
    }
  }

  /**
   * 获取频道列表
   * @param userId 用户ID
   * @param handle 频道handle
   * @param userName 用户名
   * @param id 频道ID
   * @param mine 是否查询自己的频道
   * @returns 频道列表
   */
  // async getChannelsList(params: GetChannelsListParams) {
  async getChannelsList(accountId: string, forHandle?: string, forUsername?: string, id?: string[], mine?: boolean, maxResults?: number, pageToken?: string) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client, // 使用授权的 access token
      part: ['snippet', 'contentDetails', 'statistics', 'status', 'topicDetails'],
      ...(id && { id }), // id 已为 string[] 类型
      ...(forHandle && { forHandle }),
      ...(forUsername && { forUsername }),
      ...(mine && { mine: true }),
      ...(maxResults && { maxResults }),
      ...(pageToken && { pageToken }),
    }

    try {
      const response = await this.youtubeClient.channels.list(requestParams)
      return response
    }
    catch (err) {
      this.logger.error(err)
      return err
    }
  }

  /**
   * 更新频道
   * @param accessToken
   * @param ChannelId 频道ID
   * @param brandingSettings 品牌设置
   * @param status 状态
   * @returns 更新结果
   */
  async updateChannels(accountId, ChannelId, brandingSettings, status) {
    try {
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody: any = {
        id: ChannelId,
      }

      // 如果传递了 note，则添加到请求体
      if (brandingSettings !== undefined) {
        requestBody.brandingSettings = brandingSettings
      }
      if (status !== undefined) {
        requestBody.status = status
      }

      // console.log(requestBody);

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.channelSections.update(
        {
          auth: this.oauth2Client,
          part: ['brandingSettings'],
          requestBody,
        },
      )

      return response
    }
    catch (error) {
      this.logger.error('Error Channels update:', error)
      return error
    }
  }

  /**
   * 获取频道板块列表
   * @param accessToken
   * @param channelId 频道ID
   * @param id 板块ID
   * @param mine 是否查询自己的板块
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 频道板块列表
   */
  async getChannelSectionsList(accountId: string, channelId?: string, id?: string[], mine?: boolean) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      return '获取访问令牌失败'
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client, // 使用授权的 access token
      part: ['contentDetails', 'id', 'snippet'],
      ...(channelId && { channelId }),
      ...(id && { id }), // id 已为 string[] 类型
      ...(mine && { mine: true }),
    }

    // // 根据参数选择 `id` 或 `forUsername`
    // if (id) {
    //   requestParams.id = id // 如果提供了 id, 使用 id
    // }
    // else if (channelId) {
    //   requestParams.channelId = channelId // 如果提供了 handle, 使用 handle
    // }
    // else if (mine !== undefined) {
    //   // 如果 mine 被传递且是布尔值, 可以检查是否为 `true`
    //   if (mine) {
    //     requestParams.mine = true // 请求当前登录用户的频道
    //   }
    // }

    try {
      const response = await this.youtubeClient.channelSections.list(requestParams)
      return response
    }
    catch (err) {
      this.logger.log(`The API returned an error: ${err}`)
      return err
    }
  }

  /**
   * 创建频道板块。
   *
   * @param snippet 元数据
   * @param contentDetails 内容详情
   * @returns 创建结果
   */
  async insertChannelSection(accountId, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }
      // 构造请求体
      const requestBody = {
        snippet,
        contentDetails,
      }

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.channelSections.insert(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'id', 'contentDetails'],
          requestBody,
        },
      )

      return response
    }
    catch (error) {
      this.logger.error('Error Channel Section insert:', error)
      return error
    }
  }

  /**
   * 更新频道板块。
   * @param snippet 元数据
   * @param contentDetails 内容详情
   * @returns 创建结果
   */
  async updateChannelSection(accountId, snippet, contentDetails) {
    try {
      // 设置 OAuth2 客户端凭证
      // 使用封装的辅助方法
      if (!(await this.ensureValidAccessToken(accountId))) {
        this.logger.log(`get youtube access token error. accountId" ${accountId}`)
        return new AppException(ResponseCode.ChannelAccessTokenFailed)
      }

      // 构造请求体
      const requestBody = {
        snippet,
        contentDetails,
      }

      // 调用 YouTube API 上传视频
      const response = await this.youtubeClient.channelSections.update(
        {
          auth: this.oauth2Client,
          part: ['snippet', 'id', 'contentDetails'],
          requestBody,
        },
      )
      // 返回上传的视频 ID
      return response
    }
    catch (error) {
      this.logger.error('Error uploading video:', error)
      return error
    }
  }

  /**
   * 删除频道板块
   *  @param channelSectionId 频道板块ID
   * @returns 删除结果
   */
  async deleteChannelsSections(accountId, channelSectionId) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    try {
      const response = await this.youtubeClient.channelSections.delete({
        auth: this.oauth2Client,
        id: channelSectionId,
      })
      this.logger.log('Video deleted:', response.data)
      return response
    }
    catch (error) {
      this.logger.error('Error deleting video:', error)
      return error
    }
  }

  // 上传缩略图
  async uploadThumbnails(accountId, videoId, thumbnail) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    try {
      const response = await this.youtubeClient.thumbnails.set({
        auth: this.oauth2Client,
        videoId,
        media: thumbnail,
      })
      // this.logger.log('Video deleted:', response.data)
      return response?.data?.items?.[0]?.default?.url
    }
    catch (error) {
      this.logger.error('Error deleting video:', error)
      return false
    }
  }

  /**
   * 安全地获取访问令牌并初始化YouTube客户端
   * @param accountId 账号ID
   * @returns 成功返回true，失败返回false
   */
  private async ensureValidAccessToken(accountId: string): Promise<boolean> {
    const accessToken = await this.getUserAccessToken(accountId)

    if (!accessToken) {
      return false
    }
    this.initializeYouTubeClient(accessToken)
    return true
  }

  /**
   * 搜索
   * @param userId 用户ID
   * @param handle 频道handle
   * @param userName 用户名
   * @param id 频道ID
   * @param mine 是否查询自己的频道
   * @returns 频道列表
   */
  async getSearchList(
    accountId: string,
    forMine?: boolean,
    maxResults?: number,
    order?: string, // 排序的方法。默认值为 relevance。其他可选date|rating(评分从高到低) |title|videoCount |viewCount
    pageToken?: string,
    publishedBefore?: Date,
    publishedAfter?: Date,
    q?: string, // 搜索的查询字词
    type?: string, // 默认video,其他可选 channel、playlist
    videoCategoryId?: string,
  ) {
    // 使用封装的辅助方法
    if (!(await this.ensureValidAccessToken(accountId))) {
      this.logger.log(`get youtube access token error. accountId" ${accountId}`)
      return new AppException(ResponseCode.ChannelAccessTokenFailed)
    }

    // 根据传入的参数来选择一个有效的请求参数
    const requestParams: any = {
      auth: this.oauth2Client, // 使用授权的 access token
      part: ['snippet'],
      ...(forMine && { forMine: true }),
      ...(maxResults && { maxResults }),
      ...(pageToken && { pageToken }),
      ...(order && { order }),
      ...(publishedBefore && { publishedBefore }),
      ...(publishedAfter && { publishedAfter }),
      ...(q && { q }),
      ...(type && { type }),
      ...(videoCategoryId && { videoCategoryId }),
    }

    try {
      const response = await this.youtubeClient.search.list(requestParams)
      return response
    }
    catch (err) {
      this.logger.error(err)
      return err
    }
  }

  async getAccessTokenStatus(accountId: string): Promise<number> {
    const credential = await this.getOAuth2Credential(accountId)
    if (credential && credential.access_token) {
      return 1
    }
    return 0
  }
}
