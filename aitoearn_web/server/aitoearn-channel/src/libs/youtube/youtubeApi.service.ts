/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-04-14 16:50:44
 * @LastEditors: nevin
 * @Description: Bilibili bilibili
 */
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { google } from 'googleapis'
import { config } from '@/config'
import {
  ChannelsList,
  CommentsList,
  VideosList,
} from './youtube.interface'

@Injectable()
export class YoutubeApiService {
  private oauth2Client: any
  private webClientSecret: string
  private webClientId: string
  private webRenderBaseUrl: string
  private youtubeClient = google.youtube('v3')
  private readonly logger = new Logger(YoutubeApiService.name)

  constructor() {
    this.oauth2Client = new google.auth.OAuth2()
    this.initYoutubeSecrets()
  }

  private async initYoutubeSecrets() {
    this.webClientSecret = config.youtube.secret
    this.webClientId = config.youtube.id
    this.webRenderBaseUrl = config.youtube.authBackHost
  }

  /**
   * 初始化 OAuth2 客户端并设置凭证
   * @param accessToken 传入的 access_token
   */
  setCredentials(accessToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })
  }

  /**
   * 初始化YouTube API客户端
   * @param accessToken 访问令牌
   * @returns YouTube API客户端
   */
  initializeYouTubeClient(accessToken: string): any {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.youtube({ version: 'v3', auth })
  }

  /**
   * 刷新用户的YouTube访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的系统令牌
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token'

      // 请求体的参数
      const params = new URLSearchParams({
        client_id: this.webClientId, // 使用你的 client_id
        client_secret: this.webClientSecret, // 使用你的 client_secret
        refresh_token: refreshToken, // 提供刷新令牌
        grant_type: 'refresh_token', // 认证类型是刷新令牌
      })

      // 发送 POST 请求到 Google token endpoint 来刷新 access token
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const accessTokenInfo = response.data
      return accessTokenInfo
    }
    catch (err) {
      // this.logger.error('Failed to refresh access token')
      this.logger.error(err)
    }
  }

  /**
   * 从谷歌获取用户信息
   * @param accessToken 访问令牌
   * @returns
   */
  async getUserInfoFromGoogle(accessToken: string) {
    try {
      const responseGoogle = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (responseGoogle.data.code !== 0)
        throw new Error(responseGoogle.data.message)

      return responseGoogle.data
    }
    catch (error) {
      this.logger.error(error)
      return null
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
  async getChannelsList(requestParams: ChannelsList) {
    try {
      const response = await this.oauth2Client.channels.list(requestParams)

      const channels = response.data
      this.logger.log(channels)
      if (channels.length === 0) {
        return []
      }
      else {
        return channels
      }
    }
    catch (err) {
      this.logger.log(err)
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
  async updateChannels(accessToken: string, ChannelId: string, brandingSettings: any, status: any) {
    try {
      // 设置 OAuth2 客户端凭证
      this.oauth2Client.setCredentials(accessToken)

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

      // console.log(requestBody)

      // 调用 YouTube API 上传视频
      const response = await this.initializeYouTubeClient(accessToken).channelSections.update(
        {
          part: 'brandingSettings',
          requestBody,
        },
      )

      // 返回上传的视频 ID
      if (response.data) {
        return response.data
      }
      else {
        return 'Channels updated failed'
      }
    }
    catch (error) {
      return error
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
  async getVideosList(requestParams: VideosList) {
    try {
      const response = await this.oauth2Client.videos.list(requestParams)
      const videos = response.data
      this.logger.log(videos)
      if (videos.length === 0) {
        // console.log('No videos found.');
        return []
      }
      else {
        // console.log(`This videos's ID is ${videos}.`);
        return videos
      }
    }
    catch (error) {
      return error
    }
  }

  /**
   * 获取评论列表。
   * @param id 评论ID
   * @param parentId 父评论ID
   * @param maxResults 最大结果数
   * @param pageToken 分页令牌
   * @returns 评论列表
   */
  async getCommentsList(requestParams: CommentsList) {
    try {
      const response = await this.oauth2Client.comments.list(requestParams)
      const comments = response.data
      this.logger.log(comments)
      return response
      // if (comments.length === 0) {
      //   // console.log('No comments found.');
      //   return []
      // }
      // else {
      //   // console.log(`This comments's ID is ${comments}.`);
      //   return comments
      // }
    }
    catch (error) {
      return error
    }
  }

  async insertComment(requestParams: any) {
    try {
      const response = await this.oauth2Client.comments.insert(requestParams)
      const comments = response.data
      this.logger.log(comments)
      return response
    }
    catch (error) {
      return error
    }
  }

  // async publishVideo(
  //   accountToken: string,
  //   pubParams: YoutubeVideoPubParams,
  // ): Promise<YoutubeVideoPubResult> {
  //   return new Promise(async (resolve) => {
  //     try {
  //       const { coverUrl, videoUrl } = pubParams

  //       // 发起上传
  //       const startUploadInfo = await this.startUpload(accountToken)
  //       if (startUploadInfo.result !== 1)
  //         throw new Error('发起上传失败')

  //       // 获取封面
  //       const coverBase64
  //         = await this.fileToolsService.fileUrlToBase64(coverUrl)

  //       const buffer = Buffer.from(coverBase64, 'base64')
  //       const coverBlob = new Blob([buffer], { type: 'image/jpeg' })

  //       Logger.log('封面获取成功：', coverBlob)

  //       // 视频URL分片上传
  //       void this.fileToolsService.streamDownloadAndUpload(
  //         videoUrl,
  //         async (upData: Buffer, partNumber: number) => {
  //           const res = await this.fragmentUploadVideo(
  //             startUploadInfo.upload_token,
  //             partNumber - 1,
  //             startUploadInfo.endpoint,
  //             upData,
  //           )
  //           Logger.log('分片：', partNumber, res)
  //           if (res.result !== 1)
  //             throw new Error('分片上传失败')
  //         },
  //         async (partCount) => {
  //           // 合并
  //           const res = await this.completeFragmentUpload(
  //             startUploadInfo.upload_token,
  //             partCount - 1,
  //             startUploadInfo.endpoint,
  //           )
  //           if (res.result !== 1)
  //             throw new Error('合并分片上传失败')

  //           // 发布
  //           const formData = new FormData()
  //           formData.append('caption', this.getCaption(pubParams))
  //           formData.append('cover', coverBlob)
  //           const pubRes = await axios<{
  //             video_info: KwaiPublishVideoInfo
  //             result: number
  //           }>({
  //             url: `${this.kwaiHost}/openapi/photo/publish`,
  //             method: 'POST',
  //             params: {
  //               upload_token: startUploadInfo.upload_token,
  //               app_id: this.appId,
  //               access_token: accountToken,
  //             },
  //             data: formData,
  //           })
  //           if (pubRes.data.result !== 1)
  //             throw new Error('视频发布失败！')

  //           resolve({
  //             success: true,
  //             worksId: pubRes.data.video_info.photo_id,
  //           })
  //         },
  //         4194304,
  //       )
  //     }
  //     catch (e) {
  //       this.logger.error(e)
  //       resolve({
  //         success: false,
  //         failMsg: e.message || '发布错误',
  //       })
  //     }
  //   })
  // }
}
