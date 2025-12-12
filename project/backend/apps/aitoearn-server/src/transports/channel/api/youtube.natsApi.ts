import { Injectable } from '@nestjs/common'
import { ChannelBaseApi } from '../../channelBase.api'
import { AccessToken } from './bilibili.common'

@Injectable()
export class PlatYoutubeNatsApi extends ChannelBaseApi {
  /**
   * 获取授权页面URL
   * @param userId
   * @param mail
   * @param type
   * @param prefix
   * @returns
   */
  async getAuthUrl(
    userId: string,
    mail: string,
    prefix?: string,
    spaceId?: string,
  ) {
    const res = await this.sendMessage<string>(
      `plat/youtube/authUrl`,
      {
        userId,
        mail,
        prefix,
        spaceId,
      },
    )
    return res
  }

  async setAccessToken(
    data: {
      taskId: string
      code: string
      state: string
    },
  ) {
    const res = await this.sendMessage<{
      status: number
      message: string
      accountId: string
    }>(
      `plat/youtube/setAccessToken`,
      data,
    )
    return res
  }

  /**
   * 获取账号的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const res = await this.sendMessage<AccessToken | null>(
      `plat/youtube/getAccountAuthInfo`,
      {
        accountId,
      },
    )
    return res
  }

  /**
   * 创建账号并设置授权Token
   * @param taskId 任务ID
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/getAuthInfo`,
      {
        taskId,
      },
    )
    return res
  }

  /**
   * 查询账号是否授权
   * @param accountId
   * @returns
   */
  async isAuthorized(accountId: string) {
    const res = await this.sendMessage<boolean>(
      `plat/youtube/isAuthorized`,
      {
        accountId,
      },
    )
    return res
  }

  /**
   * 刷新令牌token
   * @param accountId
   * @returns
   */
  async refreshToken(accountId: string) {
    const res = await this.sendMessage<boolean>(
      `plat/youtube/refreshToken`,
      {
        accountId,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getVideoCategories`,
      {
        accountId,
        id,
        regionCode,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getVideosList`,
      {
        accountId,
        chart,
        id,
        myRating,
        maxResults,
        pageToken,
      },
    )
    return res
  }

  /**
   * 上传视频到YouTube
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
    const res = await this.sendMessage<any>(
      `plat/youtube/uploadVideo`,
      {
        accountId,
        fileBuffer,
        fileName,
        title,
        description,
        privacyStatus,
        keywords,
        categoryId,
        publishAt,
      },
    )
    return res
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
   * @param contentLength 视频文件大小（字节）
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
    // 确保类型转换正确
    const payload = {
      accountId: String(accountId),
      title,
      description,
      keywords,
      categoryId,
      privacyStatus,
      publishAt,
      // 确保contentLength是数字类型
      contentLength: contentLength ? Number(contentLength) : undefined,
    }

    const res = await this.sendMessage<any>(
      `plat/youtube/initVideoUpload`,
      payload,
    )
    return res
  }

  /**
   * 上传视频分片
   * @param accountId 账户ID
   * @param fileBase64 分片数据的Base64编码字符串
   * @param uploadToken 上传令牌
   * @param partNumber 分片序号
   * @returns 上传结果
   */
  async uploadVideoPart(
    accountId: string,
    fileBase64: string,
    uploadToken: string,
    partNumber: number,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/uploadVideoPart`,
      {
        accountId,
        fileBase64,
        uploadToken,
        partNumber,
      },
    )
    return res
  }

  /**
   * 完成视频上传
   * @param accountId 账户ID
   * @param uploadToken 上传令牌
   * @param totalSize 视频文件的总大小（字节）
   * @returns 完成结果
   */
  async videoComplete(
    accountId: string,
    uploadToken: string,
    totalSize: number,
  ) {
    // 确保参数为基本类型，避免序列化问题
    const payload = {
      accountId: String(accountId),
      uploadToken: String(uploadToken),
      totalSize: Number(totalSize), // 确保totalSize是数字类型
    }

    const res = await this.sendMessage<any>(
      `plat/youtube/videoComplete`,
      payload,
    )
    return res
  }

  /**
   * 获取子评论列表
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getCommentsList`,
      {
        accountId,
        id,
        parentId,
        maxResults,
        pageToken,
      },
    )
    return res
  }

  // 创建顶级评论（评论会话）
  async insertCommentThreads(
    accountId: string,
    channelId: string,
    videoId: string,
    textOriginal: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/insertCommentThreads`,
      {
        accountId,
        channelId,
        videoId,
        textOriginal,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getCommentThreadsList`,
      {
        accountId,
        allThreadsRelatedToChannelId,
        id,
        videoId,
        maxResults,
        pageToken,
        order,
        searchTerms,
      },
    )
    return res
  }

  // 创建二级评论
  async insertComment(
    accountId: string,
    parentId?: string,
    textOriginal?: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/insertComment`,
      {
        accountId,
        parentId,
        textOriginal,
      },
    )
    return res
  }

  // 更新评论
  async updateComment(
    accountId: string,
    parentId: string,
    textOriginal: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/updateComment`,
      {
        accountId,
        parentId,
        textOriginal,
      },
    )
    return res
  }

  // 删除评论
  async deleteComment(accountId: string, id: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/deleteComment`,
      {
        accountId,
        id,
      },
    )
    return res
  }

  // 设置评论状态
  async setModerationStatusComments(
    accountId: string,
    id: string,
    moderationStatus?: string,
    banAuthor?: boolean,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/setModerationStatusComments`,
      {
        accountId,
        id,
        moderationStatus,
        banAuthor,
      },
    )
    return res
  }

  // 对视频点赞、踩
  async setVideoRate(accountId: string, id: string, rating: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/setVideoRate`,
      {
        accountId,
        id,
        rating,
      },
    )
    return res
  }

  // 获取视频的点赞、踩数
  async getVideoRate(accountId: string, id: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/getVideoRate`,
      {
        accountId,
        id,
      },
    )
    return res
  }

  // 删除视频
  async deleteVideo(accountId: string, id: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/deleteVideo`,
      {
        accountId,
        id,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/updateVideo`,
      {
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
      },
    )
    return res
  }

  // 创建播放列表
  async createPlaylist(
    accountId: string,
    title: string,
    description?: string,
    privacyStatus?: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/createPlaylist`,
      {
        accountId,
        title,
        description,
        privacyStatus,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getPlayList`,
      {
        accountId,
        channelId,
        id,
        mine,
        maxResults,
        pageToken,
      },
    )
    return res
  }

  // 更新播放列表
  async updatePlaylist(
    accountId: string,
    id: string,
    title: string,
    description?: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/updatePlaylist`,
      {
        accountId,
        id,
        title,
        description,
      },
    )
    return res
  }

  // 删除播放列表
  async deletePlaylist(accountId: string, id: string) {
    const res = await this.sendMessage<any>(
      `plat/youtube/deletePlaylist`,
      {
        accountId,
        id,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/insertPlayListItems`,
      {
        accountId,
        id,
        resourceId,
        position,
        note,
        startAt,
        endAt,
      },
    )
    return res
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
    const res = await this.sendMessage<{
      code: number
      message: string
      data: any
    }>(
      `plat/youtube/getPlayListItems`,
      {
        accountId,
        id,
        playlistId,
        maxResults,
        pageToken,
        videoId,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/updatePlayListItems`,
      {
        accountId,
        id,
        playlistId,
        resourceId,
        position,
        note,
        startAt,
        endAt,
      },
    )
    return res
  }

  // 删除播放列表项
  async deletePlayListItems(accountId: string, id: string) {
    const res = await this.sendMessage<{
      code: number
      message: string
      data: any
    }>(
      `plat/youtube/deletePlayListItems`,
      {
        accountId,
        id,
      },
    )
    return res
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
    const res = await this.sendMessage<any>(
      `plat/youtube/getChannelsList`,
      {
        accountId,
        forHandle,
        forUsername,
        id,
        mine,
        maxResults,
        pageToken,
      },
    )
    return res
  }

  // 获取频道板块列表
  async getChannelsSectionsList(
    accountId: string,
    channelId?: string,
    id?: string,
    mine?: boolean,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/getChannelsSectionsList`,
      {
        accountId,
        channelId,
        id,
        mine,
      },
    )
    return res
  }

  /**
   * YouTube搜索接口
   * @param accountId 账号ID
   * @param forMine 是否搜索我的内容
   * @param maxResults 最大结果数
   * @param order 排序方法
   * @param pageToken 分页令牌
   * @param publishedBefore 发布时间之前
   * @param publishedAfter 发布时间之后
   * @param q 搜索查询字词
   * @param type 搜索类型
   * @param videoCategoryId 视频类别ID
   * @returns 搜索结果
   */
  async search(
    accountId: string,
    forMine?: boolean,
    maxResults?: number,
    order?: string,
    pageToken?: string,
    publishedBefore?: string,
    publishedAfter?: string,
    q?: string,
    type?: string,
    videoCategoryId?: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/youtube/search`,
      {
        accountId,
        forMine,
        maxResults,
        order,
        pageToken,
        publishedBefore,
        publishedAfter,
        q,
        type,
        videoCategoryId,
      },
    )
    return res
  }
}
