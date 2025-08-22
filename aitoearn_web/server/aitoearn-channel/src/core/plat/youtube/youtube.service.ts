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
import axios from 'axios'

import { google } from 'googleapis'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { AppException, getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { RedisService } from '@/libs'
import { AccessToken } from '@/libs/bilibili/comment'
import {
  PlatToken,
  TokenStatus,
} from '@/libs/database/schema/platToken.schema'
import { GetChannelsListParams, GetVideosListParams } from '@/libs/youtube/comment'
import { YoutubeApiService } from '@/libs/youtube/youtubeApi.service'
import { AccountNatsApi } from '@/transports/account/account.natsApi'
import { AccountType, NewAccount } from '@/transports/account/common'

interface AuthTaskInfo {
  state: string
  userId: string
  mail: string
  status: 0 | 1
  accountId?: string
  avatar?: string
  nickname?: string
  uid?: string
}

@Injectable()
export class YoutubeService {
  private youtubeClient = google.youtube('v3')
  private webClientSecret: string
  private webClientId: string
  private webRenderBaseUrl: string
  private oauth2Client: any
  private prefix = ''
  private readonly logger = new Logger(YoutubeService.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly youtubeApiService: YoutubeApiService,
    private readonly accountService: AccountService,
    private readonly accountNatsApi: AccountNatsApi,

    @InjectModel(PlatToken.name)
    private PlatTokenModel: Model<PlatToken>,
  ) {
    this.webClientSecret = config.youtube.secret
    this.webClientId = config.youtube.id
    this.webRenderBaseUrl = config.youtube.authBackHost
    this.prefix = config.nats.prefix
    this.oauth2Client = new google.auth.OAuth2()
  }

  initializeYouTubeClient(accessToken: string): any {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    return google.youtube({ version: 'v3', auth: this.oauth2Client })
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

    const authTask = await this.redisService.get<AuthTaskInfo>(
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
      const googleId = payload.sub
      const email = payload.email
      // console.log("payload:", payload);
      const userId = authTask.userId
      // console.log('-----userId:----', userId)
      // 获取YouTube频道信息，用于更新账号数据库
      const accountInfo: any = await this.updateYouTubeAccountInfo(
        userId,
        email,
        googleId,
        access_token,
        refresh_token,
        expires_in,
      )

      // 缓存令牌
      let res = await this.redisService.setKey(
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
      let accountToken = await this.PlatTokenModel.findOne({
        platform: AccountType.YOUTUBE,
        accountId: googleId,
      })

      if (accountToken) {
        // 更新现有令牌
        if (refresh_token && refresh_token.trim() !== '') {
          accountToken.refreshToken = refresh_token
        }

        accountToken.expiresAt = new Date(
          (getCurrentTimestamp() + expires_in) * 1000,
        )
        accountToken.updatedAt = new Date()
        await accountToken.save()
      }
      else {
        // 创建新的令牌记录
        accountToken = await this.PlatTokenModel.create({
          userId,
          platform: AccountType.YOUTUBE,
          accountId: googleId,
          refreshToken: refresh_token,
          status: TokenStatus.NORMAL,
          createTime: new Date(),
          updateTime: new Date(),
          expiresAt: new Date((getCurrentTimestamp() + expires_in) * 1000),
        })
      }

      // 更新任务信息
      authTask.status = 1
      authTask.accountId = accountInfo.id
      authTask.mail = email
      res = await this.redisService.setKey<AuthTaskInfo>(
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

  /**
   * 设置授权Token
   * @param taskId
   * @param data
   * @returns
   */
  async setAccessToken(taskId: any, code: string) {
    const hadState = await this.redisService.get<AuthTaskInfo>(
      `youtube:authTask:${taskId}`,
    )

    this.logger.log(`--hadState:-- ${hadState}`)
    if (!hadState)
      return null
    if (hadState?.state !== taskId)
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

      // this.logger.log(`response:-- ${response}`)
      const accessTokenInfo = response.data
      const access_token = accessTokenInfo.access_token
      const refresh_token = accessTokenInfo.refresh_token
      const expires_in = accessTokenInfo.expires_in
      const id_token = accessTokenInfo.id_token
      this.logger.log(`response2:-- ${response.data}, ${accessTokenInfo.id_token}`)
      // 验证ID令牌以获取用户信息
      this.initializeYouTubeClient(access_token)
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: id_token,
        audience: this.webClientId,
      })

      const payload = ticket.getPayload()
      const googleId = payload.sub
      const email = payload.email
      // this.logger.log('youtube callback payload:', payload)
      const userId = hadState.userId
      this.logger.log(`-----userId:---- ${userId} , googleId:---- ${googleId}`)
      // 获取YouTube频道信息，用于更新账号数据库
      const accountInfo: any = await this.updateYouTubeAccountInfo(
        userId,
        email,
        googleId,
        access_token,
        refresh_token,
        expires_in,
      )

      // console.log('获取到的accountInfo:', accountInfo);
      // 缓存令牌
      await this.redisService.setKey(
        `youtube:accessToken:${accountInfo.id}`,
        accessTokenInfo,
        expires_in,
      )

      // 更新任务信息
      hadState.status = 1
      hadState.accountId = accountInfo.id
      hadState.avatar = accountInfo.avatar
      hadState.nickname = accountInfo.nickname
      hadState.mail = email
      hadState.uid = googleId
      await this.redisService.setKey<AuthTaskInfo>(
        `youtube:authTask:${taskId}`,
        hadState,
        60 * 3,
      )

      // // 返回系统令牌
      console.log('最终返回', accountInfo);
      return {
        status: 1,
        message: '授权成功',
        accountId: accountInfo.id,
      }

      // return results;
    }
    catch (error) {
      this.logger.log(`处理授权码失败: ${error}`)
      // console.error('处理授权码失败:', error)
      // throw new Error('授权失败');
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
  ): Promise<unknown> {
    try {
      // 初始化YouTube客户端
      const youtube = this.initializeYouTubeClient(accessToken)

      let newAccount = email
      let newNickname = ''
      let newAvatar = ''
      let channelId = ''

      let hasChannel = false
      // 获取当前用户的YouTube频道信息
      const response = await youtube.channels.list({
        part: 'snippet,statistics',
        mine: true,
      })

      if (!response.data.items || response.data.items.length === 0) {
        this.logger.log(`获取YouTube频道信息失败`)
        hasChannel = false
        // 如果没有频道或获取频道信息失败，则从Google用户信息获取
        if (!hasChannel) {
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
            // 使用基本信息，确保至少有账号名称
            newAccount = googleId
            newNickname = 'YouTube User'
          }
        }
      }
      else {
        hasChannel = true
        const channel = response.data.items[0]
        // 使用频道信息更新账号数据
        channelId = channel.id
        newAccount = channel.id
        newNickname = channel.snippet.title
        newAvatar = channel.snippet.thumbnails.default.url
        // channelInfo.fansCount = parseInt(channel.statistics.subscriberCount) || 0;
        // channelInfo.workCount = parseInt(channel.statistics.videoCount) || 0;
        // channelInfo.readCount = parseInt(channel.statistics.viewCount) || 0;
        this.logger.log(`成功获取YouTube频道信息: ${channel.snippet.title}`)
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
      });
      // console.log("youtube channelInfo:",channelInfo);

      // 然后单独设置 loginTime
      (channelInfo as any).loginTime = new Date();
      (channelInfo as any).lastStatsTime = new Date()
      // console.log(channelInfo)
      this.logger.log(`channelInfo:-- ${channelInfo}`)
      const accountInfo = await this.accountService.createAccount(
        {
          userId,
          type: AccountType.YOUTUBE,
          uid: googleId,
        },
        channelInfo,
      )
      // console.log('----- accountInfo', accountInfo)

      if (!accountInfo)
        return '创建账号失败'

      return accountInfo
    }
    catch (error) {
      this.logger.error('更新YouTube账号信息失败:', error)
      // 不抛出异常，避免影响授权流程
      return `更新YouTube账号信息失败`
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
    console.log(accountId, refreshToken)
    const accessTokenInfo
      = await this.youtubeApiService.refreshAccessToken(refreshToken)
    if (!accessTokenInfo)
      return ''

    const expires = accessTokenInfo.expires_in
    const res = await this.redisService.setKey(
      `youtube:accessToken:${accountId}`,
      accessTokenInfo,
      expires,
    )
    if (!res)
      return ''

    return accessTokenInfo.access_token
  }

  /**
   * 获取用户的Youtube访问令牌
   * @param accountId 账号ID
   * @returns 访问令牌
   */
  async getUserAccessToken(accountId: string): Promise<string> {
    this.logger.log('获取访问令牌，accountId:', accountId)
    console.log(accountId)

    // 先检查Redis缓存
    const cachedToken = await this.redisService.get<AccessToken>(
      `youtube:accessToken:${accountId}`,
    )
    // this.logger.log('cachedToken:', cachedToken)
    if (cachedToken && cachedToken.access_token) {
      return cachedToken.access_token
    }

    // 如果缓存中没有，尝试刷新
    // const accountTokenInfo = await this.accountService.findOne({
    //   accountId,
    // })
    const result = await this.accountNatsApi.getAccountByParam({ account: accountId })
    // 从结果中获取refresh_token - 根据实际返回结构处理
    const refreshToken = result.data?.refresh_token || (result as any).refresh_token
    console.log('resolved refresh_token:', refreshToken)
    if (!refreshToken) {
      this.logger.error('无效的账号或刷新令牌丢失')
      return '无效的账号或刷新令牌丢失'
    }

    // 刷新并获取新令牌
    const refreshResult = await this.refreshAccessToken(
      accountId,
      refreshToken,
    )
    if (!refreshResult) {
      this.logger.error('刷新令牌后未能获取访问令牌')
      return '刷新令牌失败'
    }

    // 刷新后再次从Redis获取
    const newToken = await this.redisService.get<AccessToken>(
      `youtube:accessToken:${accountId}`,
    )
    // console.log('newToken:', newToken);
    if (!newToken || !newToken.access_token) {
      // console.log('刷新令牌后未能获取访问令牌');
      return ''
    }

    return newToken.access_token
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
    type: 'h5' | 'pc',
    prefix?: string,
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
    const rRes = await this.redisService.setKey<AuthTaskInfo>(
      `youtube:authTask:${state}`,
      { state, status: 0, userId, mail },
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
    const data = await this.redisService.get<{
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
    this.logger.log('youtubeService getVideoCategoriesList:', accountId, id, regionCode)
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 根据传入的参数来选择一个有效的请求参数

    this.initializeYouTubeClient(accessToken)
    try {
      // this.logger.log(requestBody)
      const response = await this.youtubeClient.videoCategories.list({
        part: ['snippet'],
        ...(id && { id: [id] }),
        ...(regionCode && { regionCode }),
        auth: this.oauth2Client,
      })

      this.logger.log(response.data)
      return response
    }
    catch (err) {
      this.logger.error(`The API returned an error: ${err}`)
      return err
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)

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
    publishAt?: string,
  ) {
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
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

      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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

      if (publishAt) {
        requestBody.status.publishAt = publishAt // 如果提供了 publishAt 则使用 publishAt
      }
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
   * @param publishAt 发布时间
   */
  async initVideoUpload(
    accountId: string,
    title: string,
    description: string,
    tags: string[],
    categoryId = '22',
    privacy = 'private',
    publishAt?: string,
    contentLength?: number, // 添加文件大小参数
  ) {
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    try {
      // 准备视频元数据
      const requestBody: {
        snippet: {
          title: string
          description: string
          tags: string[]
          categoryId: string
        }
        status: {
          privacyStatus: string
          selfDeclaredMadeForKids: boolean
          publishAt?: string // Add this optional property
        }
      } = {
        snippet: {
          title,
          description,
          tags,
          categoryId,
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        },
      }

      if (publishAt) {
        requestBody.status.publishAt = publishAt
      }

      // 正确的 resumable upload 初始化
      // const axios = require('axios')
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

      this.logger.log('=================================')
      this.logger.log('初始化上传请求参数:', requestBody)
      this.logger.log('视频总长度:', contentLength)
      this.logger.log('=================================')

      // console.log('初始化上传请求参数:', {
      //   url,
      //   params: {
      //     uploadType: 'resumable',
      //     part: 'snippet,status,contentDetails',
      //   },
      //   headers,
      //   data: JSON.stringify(requestBody),
      // });

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
      this.logger.error('Error initializing video upload:', error.message)
      // throw new OptRpcException(50001, `初始化视频上传失败: ${error.message}`);
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
      throw new AppException(10010, '账号有误')

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
      throw new AppException(10010, '账号有误')

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
      // return {
      //   status: response.status,
      //   data: response.data,
      // }
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    this.initializeYouTubeClient(accessToken)
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
      const response = await this.oauth2Client.comments.list(requestParams)
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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      this.initializeYouTubeClient(accessToken)
      // 构造请求体
      const requestBody = {
        snippet: {
          parentId,
          textOriginal,
        },
      }
      // this.logger.log(requestBody)
      // 调用 YouTube API 上传视频
      const response = await this.oauth2Client.comments.insert({
        auth: this.oauth2Client,
        part: 'snippet,id',
        requestBody,
      })
      // const response = await this.youtubeApiService.insertComment({
      //   auth: this.oauth2Client,
      //   part: 'snippet,id',
      //   requestBody,
      // })
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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    this.initializeYouTubeClient(accessToken)
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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)
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
    // 设置 OAuth2 客户端凭证
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)

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
      // 设置 OAuth2 客户端凭证
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      // // 返回上传的视频 ID
      // if (response.data) {
      //   this.logger.log('Playlist insert successfully:', response.data)
      //   return response
      // }
      // else {
      //   return 'Video upload failed'
      // }
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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken)
        throw new AppException(10010, '账号有误')
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return '获取访问令牌失败'
    }

    this.initializeYouTubeClient(accessToken)
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
      // const channels
      //   = await this.youtubeApiService.getChannelsList(requestParams)
      // return channels
      // this.logger.log(requestParams)
      console.log(requestParams)
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
      const accessToken = await this.getUserAccessToken(accountId)
      if (!accessToken) {
        this.logger.error('获取访问令牌失败')
        return '获取访问令牌失败'
      }
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return '获取访问令牌失败'
    }

    this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return '获取访问令牌失败'
    }
    try {
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
      Logger.error('Error Channel Section insert:', error)
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return '获取访问令牌失败'
    }

    try {
      // 设置 OAuth2 客户端凭证
      this.initializeYouTubeClient(accessToken)

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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return '获取访问令牌失败'
    }

    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)
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
    const accessToken = await this.getUserAccessToken(accountId)
    if (!accessToken) {
      this.logger.error('获取访问令牌失败')
      return false
    }

    // 设置 OAuth2 客户端凭证
    this.initializeYouTubeClient(accessToken)
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
}
