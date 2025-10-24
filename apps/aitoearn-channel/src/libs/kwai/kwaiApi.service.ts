import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { chunkedDownloadFile, fileUrlToBase64, getRemoteFileSize } from '../../common'
import { config } from '../../config'
import {
  KwaiAccessTokenQuery,
  KwaiApiResponse,
  KwaiChunkedUploadQuery,
  KwaiDeleteVideoResponse,
  KwaiFinalizeUploadQuery,
  KwaiOAuthCredentialsResponse,
  KwaiPhotoListQuery,
  KwaiPublishVideoQuery,
  KwaiPublishVideoResponse,
  KwaiRefreshTokenQuery,
  KwaiStartUploadQuery,
  KwaiStartUploadResponse,
  KwaiUserInfoQuery,
  KwaiUserInfoResponse,
  KwaiVideoListResponse,
  KwaiVideoPubParams,
  KwaiVideoPubResult,
  KwaiVideoUploadResponse,
} from './kwaiApi.interfaces'

@Injectable()
export class KwaiApiService {
  private readonly appId: string
  private readonly appSecret: string
  private readonly redirectUri
  private readonly kwaiAPIHost = 'https://open.kuaishou.com'
  private readonly logger = new Logger(KwaiApiService.name)

  constructor() {
    const cfg = config.kwai
    this.appId = cfg.id
    this.appSecret = cfg.secret
    this.redirectUri = cfg.authBackHost
  }

  private async request<T>(url: string, config: AxiosRequestConfig = {}): Promise<KwaiApiResponse<T>> {
    this.logger.log(`Kwai API Request:${config.method || 'GET'}  ${url} with params: ${JSON.stringify(config.params)}`)
    try {
      const response: AxiosResponse<KwaiApiResponse<T>> = await axios(url, config)
      const data = response.data
      if (typeof data?.result === 'number' && data.result !== 1) {
        this.logger.error(`${config.method || 'GET'} ${url} failed, response: ${JSON.stringify(data)}`)
        throw new Error(data.error_msg || 'Kwai API business error')
      }
      return data
    }
    catch (error: unknown) {
      this.logger.error(`Kwai API request failed (network): ${url}`, error)
      throw new Error('Kwai API network error')
    }
  }

  /**
   * 刷新token
   * @param refresh_token
   */
  async refreshToken(refresh_token: string) {
    const params: KwaiRefreshTokenQuery = {
      app_id: this.appId,
      app_secret: this.appSecret,
      refresh_token,
      grant_type: 'refresh_token',
    }
    const url = `${this.kwaiAPIHost}/oauth2/refresh_token`
    return await this.request<KwaiOAuthCredentialsResponse>(url, { params })
  }

  /**
   * 获取登陆授权页
   * @param taskId
   * @param type 'h5' | 'pc'
   */
  getAuthPage(taskId: string, type: 'h5' | 'pc') {
    const params = new URLSearchParams({
      app_id: this.appId,
      scope: 'user_info,user_video_publish,user_video_info',
      response_type: 'code',
      ...(type === 'pc' ? { ua: 'pc' } : {}),
      redirect_uri: `${this.redirectUri}/${taskId}`,
    })
    const authParams = params.toString()
    return `${this.kwaiAPIHost}/oauth2/authorize?${authParams}`
  }

  /**
   * 根据code获取快手账号的accessToken和refresh_token
   * @param code
   */
  async getLoginAccountToken(code: string) {
    const params: KwaiAccessTokenQuery = {
      app_id: this.appId,
      app_secret: this.appSecret,
      code,
      grant_type: 'authorization_code',
    }
    const url = `${this.kwaiAPIHost}/oauth2/access_token`
    return await this.request<KwaiOAuthCredentialsResponse>(url, { method: 'POST', params })
  }

  /**
   * 获取快手账号信息
   * @param accessToken
   */
  async getAccountInfo(accessToken: string) {
    const params: KwaiUserInfoQuery = {
      app_id: this.appId,
      access_token: accessToken,
    }
    const url = `${this.kwaiAPIHost}/openapi/user_info`
    const data = await this.request<KwaiUserInfoResponse>(url, { params })
    return data.user_info
  }

  /**
   * 发起上传
   */
  async startUpload(accessToken: string) {
    this.logger.log('Initialize kwai video upload')
    const params: KwaiStartUploadQuery = {
      app_id: this.appId,
      access_token: accessToken,
    }
    const url = `${this.kwaiAPIHost}/openapi/photo/start_upload`
    const data = await this.request<KwaiStartUploadResponse>(url, { method: 'POST', params })
    this.logger.log(`Kwai video upload initialized: ${JSON.stringify(data)}`)
    return data
  }

  /**
   * 上传视频 - 分片上传
   * @param upload_token 需通过 {@link startUpload} 方法获得
   * @param endpoint 需通过 {@link startUpload} 方法获得
   * @param fragment_id 分片id 从0开始
   * @param video 分片视频的 {@link ArrayBuffer}
   */
  async fragmentUploadVideo(
    upload_token: string,
    fragment_id: number,
    endpoint: string,
    video: Buffer,
  ) {
    const params: KwaiChunkedUploadQuery = { fragment_id, upload_token }
    const url = `http://${endpoint}/api/upload/fragment`
    return await this.request<KwaiVideoUploadResponse>(url, {
      method: 'POST',
      params,
      headers: { 'Content-Type': 'application/octet-stream' },
      data: video,
    })
  }

  /**
   * 完成分片上传
   * @param upload_token upload_token 需通过 {@link startUpload} 方法获得}
   * @param fragment_count 分片总数
   * @param endpoint 需通过 {@link startUpload} 方法获得
   */
  async completeFragmentUpload(
    upload_token: string,
    fragment_count: number,
    endpoint: string,
  ) {
    const params: KwaiFinalizeUploadQuery = { fragment_count, upload_token }
    const url = `http://${endpoint}/api/upload/complete`
    return await this.request<KwaiVideoUploadResponse>(url, { method: 'POST', params })
  }

  // 处理描述和话题，获取caption
  getCaption(params: KwaiVideoPubParams) {
    const { describe, topics } = params
    let caption = ''

    if (describe) {
      caption += `${describe} `
    }

    if (topics && topics.length !== 0) {
      for (const topic of topics) {
        caption += `#${topic} `
      }
    }

    return caption.trim()
  }

  /**
   * 视频发布 发布视频接口为异步发布，该接口返回结果后，不代表视频已经同步发布到用户P页。如关心最终发布结果，需要自行判断。
   * @param accountToken
   * @param pubParams 视频发布参数
   */
  async publishVideo(
    accountToken: string,
    pubParams: KwaiVideoPubParams,
  ): Promise<KwaiVideoPubResult> {
    try {
      const { coverUrl, videoUrl } = pubParams
      this.logger.log(`start kwai video publish, videoUrl: ${videoUrl}, coverUrl: ${coverUrl}`)
      const startUploadInfo = await this.startUpload(accountToken)
      if (startUploadInfo.result !== 1)
        throw new Error('发起上传失败')

      const contentLength = await getRemoteFileSize(videoUrl)
      if (!contentLength) {
        throw new Error('get video meta failed')
      }
      let chunkSize = 5 * 1024 * 1024 // 5MB
      if (contentLength < chunkSize) {
        chunkSize = contentLength
      }

      const totalParts = Math.ceil(contentLength / chunkSize)
      for (let partNumber = 0; partNumber < totalParts; partNumber++) {
        const start = partNumber * chunkSize
        const end = Math.min(start + chunkSize - 1, contentLength - 1)
        const range: [number, number] = [start, end]
        const videoBlob = await chunkedDownloadFile(videoUrl, range)
        if (!videoBlob) {
          throw new Error('download video chunk failed')
        }

        const uploadResult = await this.fragmentUploadVideo(
          startUploadInfo.upload_token,
          partNumber,
          startUploadInfo.endpoint,
          videoBlob,
        )
        this.logger.log(`chunked upload complete: ${JSON.stringify(uploadResult)}`)
      }

      const finalizeUploadRes = await this.completeFragmentUpload(
        startUploadInfo.upload_token,
        totalParts,
        startUploadInfo.endpoint,
      )
      if (finalizeUploadRes.result !== 1)
        throw new Error('finalize video upload failed')

      this.logger.log('Video upload complete, proceed to publish')
      // 获取封面
      const coverBase64 = await fileUrlToBase64(coverUrl)
      const buffer = Buffer.from(coverBase64, 'base64')
      const coverBlob = new Blob([buffer], { type: 'image/jpeg' })
      this.logger.log('Cover image fetched and converted to Blob')

      const formData = new FormData()
      formData.append('caption', this.getCaption(pubParams))
      formData.append('cover', coverBlob)
      const params: KwaiPublishVideoQuery = {
        upload_token: startUploadInfo.upload_token,
        app_id: this.appId,
        access_token: accountToken,
      }
      const publishUrl = `${this.kwaiAPIHost}/openapi/photo/publish`
      const pubRes = await this.request<KwaiPublishVideoResponse>(publishUrl, {
        method: 'POST',
        params,
        data: formData,
      })
      this.logger.log(`Kwai video publish response: ${JSON.stringify(pubRes)}`)
      if (pubRes.result !== 1)
        throw new Error('视频发布失败！')
      return {
        success: true,
        worksId: pubRes.video_info.photo_id,
      }
    }
    catch (e) {
      this.logger.error(e)
      return {
        success: false,
        failMsg: e.message || '视频发布失败',
      }
    }
  }

  /**
   * 获取快手视频列表
   * @param accessToken
   * @param cursor
   * @param count
   */
  async fetchVideoList(accessToken: string, cursor?: string, count?: number) {
    const params: KwaiPhotoListQuery = {
      app_id: this.appId,
      access_token: accessToken,
      ...(cursor ? { cursor } : {}),
      ...(count ? { count } : {}),
    }
    const url = `${this.kwaiAPIHost}/openapi/photo/list`
    const data = await this.request<KwaiVideoListResponse>(url, { params })
    if (!data.video_list)
      throw new Error('快手获取快手视频列表失败')
    return data.video_list
  }

  async deleteVideo(accessToken: string, videoId: string) {
    const body = {
      app_id: this.appId,
      access_token: accessToken,
      photo_id: videoId,
    }
    const url = `${this.kwaiAPIHost}/openapi/photo/delete`
    const data = await this.request<KwaiDeleteVideoResponse>(url, { method: 'POST', data: body })
    if (!data.result)
      throw new Error('快手删除视频失败')
    return data.result
  }
}
