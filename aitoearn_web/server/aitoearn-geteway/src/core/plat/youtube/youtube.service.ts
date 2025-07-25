import { Injectable, Logger } from '@nestjs/common'
import { AppHttpException } from 'src/common/filters/httpException.filter'
import { RedisService } from 'src/libs/redis/redis.service'
import { AccountNatsApi } from 'src/transports/account/account.natsApi'
import { PlatYoutubeNatsApi } from 'src/transports/plat/youtube.natsApi'
import { AddAccount } from '../plat.utils'

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name)

  constructor(
    private readonly platYoutubeNatsApi: PlatYoutubeNatsApi,
    private readonly accountNatsApi: AccountNatsApi,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 检查登陆状态是否过期
   * @param accountId
   * @returns
   */
  async checkAccountAuthStatus(accountId: string) {
    const res = await this.platYoutubeNatsApi.getAccountAuthInfo(accountId)
    return res
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @returns
   */

  async createAccountAndAuth(taskId: string) {
    const taskInfo = await this.platYoutubeNatsApi.getAuthInfo(taskId)
    return await AddAccount(taskInfo, this.accountNatsApi)
  }

  /**
   * 刷新令牌token
   *
   */

  async refreshToken(accountId: string) {
    return await this.platYoutubeNatsApi.refreshToken(accountId)
  }

  /**
   * 获取视频类别列表
   * @param accountId 账户ID
   * @param id 类别ID（可选）
   * @param regionCode 地区代码（可选）
   * @returns 视频类别列表
   */
  async getVideoCategories(
    accountId: string,
    id?: string,
    regionCode?: string,
  ) {
    // this.logger.log(accountId, id, regionCode);
    const { code, data, message }
      = await this.platYoutubeNatsApi.getVideoCategories(
        accountId,
        id,
        regionCode,
      )
    this.logger.log(code, data, message)
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  /**
   * 获取视频列表
   * @param accountId 账户ID
   * @param id 视频ID（可选）
   * @param myRating 是否获取我评分的视频（可选）
   * @param maxResults 最大返回结果数（可选）
   * @param pageToken 分页令牌（可选）
   * @returns 视频列表
   */
  async getVideosList(
    accountId: string,
    chart?: string,
    id?: string,
    myRating?: boolean,
    maxResults?: number,
    pageToken?: string,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.getVideosList(
      accountId,
      chart,
      id,
      myRating,
      maxResults,
      pageToken,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  /**
   * 上传整个视频到YouTube
   * @param accountId 账户ID
   * @param fileBuffer 视频文件Buffer
   * @param fileName 文件名
   * @param title 视频标题
   * @param description 视频描述
   * @param privacyStatus 隐私状态（public, private, unlisted）
   * @param keywords 关键词（可选）
   * @param categoryId 视频类别ID（可选）
   * @param publishAt 发布时间（可选）
   * @returns 上传结果
   */
  async uploadVideo(
    accountId: string,
    fileBuffer: Buffer,
    fileName: string,
    title: string,
    description: string,
    privacyStatus: string,
    keywords?: string,
    categoryId?: string,
    publishAt?: string,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.uploadVideo(
      accountId,
      fileBuffer,
      fileName,
      title,
      description,
      privacyStatus,
      keywords,
      categoryId,
      publishAt,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  /**
   * 初始化视频分片上传
   * @param accountId 账户ID
   * @param title 视频标题
   * @param description 视频描述
   * @param keywords 关键词（可选）
   * @param categoryId 视频类别ID（可选）
   * @param privacyStatus 隐私状态（public, private, unlisted）（可选）
   * @param publishAt 发布时间（可选）
   * @param contentLength 视频文件总大小，字节数（可选）
   * @returns 上传会话信息
   */
  async initVideoUpload(
    accountId: string,
    title: string,
    description: string,
    keywords?: string,
    categoryId?: string,
    privacyStatus?: string,
    publishAt?: string,
    contentLength?: number,
  ) {
    console.log('Gateway Service - 初始化视频上传:', {
      accountId,
      title,
      contentLength,
    })

    const { code, data, message }
      = await this.platYoutubeNatsApi.initVideoUpload(
        accountId,
        title,
        description,
        keywords,
        categoryId,
        privacyStatus,
        publishAt,
        contentLength,
      )
    if (code)
      throw new AppHttpException(code, message)
    return data
  }

  /**
   * 上传视频分片
   * @param accountId 账户ID
   * @param file 分片数据
   * @param uploadToken 上传令牌
   * @param partNumber 分片序号
   * @returns 上传结果
   */
  async uploadVideoPart(
    accountId: string,
    file: Buffer,
    uploadToken: string,
    partNumber: number,
  ) {
    // 将Buffer转换为base64字符串以避免NATS序列化问题
    const fileBase64 = file.toString('base64')

    console.log(
      `准备上传分片，accountId: ${accountId}, uploadToken: ${uploadToken}, partNumber: ${partNumber}, fileSize: ${file.length}, base64Size: ${fileBase64.length}`,
    )

    const { code, data, message }
      = await this.platYoutubeNatsApi.uploadVideoPart(
        accountId,
        fileBase64,
        uploadToken,
        partNumber,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  /**
   * 完成视频上传
   * @param accountId 账户ID
   * @param uploadToken 上传令牌
   * @returns 完成结果
   */
  async videoComplete(
    accountId: string,
    uploadToken: string,
    totalSize: number,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.videoComplete(
      accountId,
      uploadToken,
      totalSize,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  /**
   * 获取评论列表
   * @param accountId 账户ID
   * @param id 评论ID
   * @param parentId 父评论ID
   * @param maxResults 最大返回结果数
   * @param pageToken 分页令牌
   * @returns 评论列表
   */
  async getCommentsList(
    accountId: string,
    id?: string,
    parentId?: string,
    maxResults?: number,
    pageToken?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.getCommentsList(
        accountId,
        id,
        parentId,
        maxResults,
        pageToken,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 创建顶级评论（评论会话）
  async insertCommentThreads(
    accountId: string,
    channelId: string,
    videoId: string,
    textOriginal: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.insertCommentThreads(
        accountId,
        channelId,
        videoId,
        textOriginal,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 获取评论会话列表
  async getCommentThreadsList(
    accountId: string,
    allThreadsRelatedToChannelId?: string,
    id?: string,
    videoId?: string,
    maxResults?: number,
    pageToken?: string,
    order?: string,
    searchTerms?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.getCommentThreadsList(
        accountId,
        allThreadsRelatedToChannelId,
        id,
        videoId,
        maxResults,
        pageToken,
        order,
        searchTerms,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 创建二级评论
  async insertComment(
    accountId: string,
    parentId: string,
    textOriginal: string,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.insertComment(
      accountId,
      parentId,
      textOriginal,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 更新评论
  async updateComment(accountId: string, id: string, textOriginal: string) {
    const { code, data, message } = await this.platYoutubeNatsApi.updateComment(
      accountId,
      id,
      textOriginal,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 设置评论会话的审核状态
  async setCommentThreadsModerationStatus(
    accountId: string,
    id: string,
    moderationStatus: string,
    banAuthor?: boolean,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.setModerationStatusComments(
        accountId,
        id,
        moderationStatus,
        banAuthor,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 删除评论
  async deleteComment(accountId: string, id: string) {
    const { code, data, message } = await this.platYoutubeNatsApi.deleteComment(
      accountId,
      id,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 获取视频评分
  async getVideoRate(accountId: string, id: string) {
    const { code, data, message } = await this.platYoutubeNatsApi.getVideoRate(
      accountId,
      id,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 设置视频评分
  async setVideoRate(accountId: string, id: string, rating: string) {
    const { code, data, message } = await this.platYoutubeNatsApi.setVideoRate(
      accountId,
      id,
      rating,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 删除视频
  async deleteVideo(accountId: string, id: string) {
    const { code, data, message } = await this.platYoutubeNatsApi.deleteVideo(
      accountId,
      id,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 更新视频
  async updateVideo(
    accountId: string,
    id: string,
    title: string,
    categoryId: string,
    defaultLanguage?: string,
    description?: string,
    privacyStatus?: string,
    tags?: string,
    publishAt?: string,
    recordingDate?: string,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.updateVideo(
      accountId,
      id,
      title,
      categoryId,
      defaultLanguage,
      description,
      privacyStatus,
      tags,
      publishAt,
      recordingDate,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 创建播放列表
  async createPlaylist(
    accountId: string,
    title: string,
    description?: string,
    privacyStatus?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.createPlaylist(
        accountId,
        title,
        description,
        privacyStatus,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 更新播放列表
  async updatePlaylist(
    accountId: string,
    id: string,
    title: string,
    description?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.updatePlaylist(
        accountId,
        id,
        title,
        description,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 删除播放列表
  async deletePlaylist(accountId: string, id: string) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.deletePlaylist(accountId, id)
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 获取播放列表
  async getPlayList(
    accountId: string,
    channelId?: string,
    id?: string,
    mine?: boolean,
    maxResults?: number,
    pageToken?: string,
  ) {
    const { code, data, message } = await this.platYoutubeNatsApi.getPlayList(
      accountId,
      channelId,
      id,
      mine,
      maxResults,
      pageToken,
    )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 插入播放列表项
  async insertPlayListItems(
    accountId: string,
    id: string,
    resourceId: string,
    position?: number,
    note?: string,
    startAt?: string,
    endAt?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.insertPlayListItems(
        accountId,
        id,
        resourceId,
        position,
        note,
        startAt,
        endAt,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 获取播放列表项
  async getPlayListItems(
    accountId: string,
    id?: string,
    playlistId?: string,
    maxResults?: number,
    pageToken?: string,
    videoId?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.getPlayListItems(
        accountId,
        id,
        playlistId,
        maxResults,
        pageToken,
        videoId,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 更新播放列表项
  async updatePlayListItems(
    accountId: string,
    id: string,
    playlistId: string,
    resourceId: string,
    position?: number,
    note?: string,
    startAt?: string,
    endAt?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.updatePlayListItems(
        accountId,
        id,
        playlistId,
        resourceId,
        position,
        note,
        startAt,
        endAt,
      )
    if (code)
      throw new AppHttpException(code, message)

    return data
  }

  // 删除播放列表项
  async deletePlayListItems(accountId: string, id: string) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.deletePlayListItems(accountId, id)
    if (code)
      throw new AppHttpException(code, message)
    return data
  }

  // 获取频道列表
  async getChannelsList(
    accountId: string,
    forHandle?: string,
    forUsername?: string,
    id?: string,
    mine?: boolean,
    maxResults?: number,
    pageToken?: string,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.getChannelsList(
        accountId,
        forHandle,
        forUsername,
        id,
        mine,
        maxResults,
        pageToken,
      )
    if (code)
      throw new AppHttpException(code, message)
    return data
  }

  // 获取频道板块列表
  async getChannelsSectionsList(
    accountId: string,
    channelId?: string,
    id?: string,
    mine?: boolean,
  ) {
    const { code, data, message }
      = await this.platYoutubeNatsApi.getChannelsSectionsList(
        accountId,
        channelId,
        id,
        mine,
      )
    if (code)
      throw new AppHttpException(code, message)
    return data
  }

  async getCommonParams() {
    return await this.redisService.get<string>(
      `youtube:common:params`,
      true,
    )
  }
}
