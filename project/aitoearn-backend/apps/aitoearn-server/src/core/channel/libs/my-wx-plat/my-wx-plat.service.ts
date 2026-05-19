/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: MyWxPlat
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../../../config'
import { MediaType, WxGzhArticleNews, WxGzhArticleNewsPic } from '../wx-gzh/common'
import { WxGZHError } from '../wx-gzh/wx-gzh.exception'
import { WxPlatAuthorizerInfo } from './comment'

@Injectable()
export class MyWxPlatApiService {
  private id = ''
  private secret = ''
  private hostUrl = ''
  private readonly logger = new Logger(MyWxPlatApiService.name)
  constructor() {
    const cfg = config.channel.myWxPlat
    this.id = cfg.id
    this.secret = cfg.secret
    this.hostUrl = cfg.hostUrl

    this.logger.log(`MyWxPlatApiService 初始化: id=${this.id}, hostUrl=${this.hostUrl}`)

    if (!this.id || !this.secret || !this.hostUrl) {
      this.logger.error(`MyWxPlat 配置不完整: id=${this.id}, secret=${this.secret ? '已设置' : '未设置'}, hostUrl=${this.hostUrl}`)
    }
  }

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    if (!config.headers) {
      config.headers = {
        'Content-Type': 'application/json',
        'secret': this.secret,
      }
    }
    const operation = options.operation || 'myWxPlat request'
    this.logger.debug(`[myWxPlat:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(`[myWxPlat:${operation}] Response <- ${url} status=${response.status} data=${JSON.stringify(response.data)}`)
      if (this.isFailedCommonResponse(response.data)) {
        throw WxGZHError.buildFromResponse(
          {
            errcode: response.data.code,
            errmsg: response.data.message,
          },
          operation,
        )
      }
      return response.data
    }
    catch (error: unknown) {
      const err = WxGZHError.buildFromError(error, operation)
      this.logger.error(err, `[myWxPlat:${operation}] Error !! ${url} kind=${err.kind} httpStatus=${err.cause.httpStatus ?? 'N/A'} platformCode=${err.cause.platformCode ?? 'N/A'} platformMessage=${err.cause.platformMessage || 'N/A'}`)
      throw err
    }
  }

  private isFailedCommonResponse(data: unknown): data is { code: number, message: string } {
    return !!data
      && typeof data === 'object'
      && 'code' in data
      && typeof (data as { code?: unknown }).code === 'number'
      && (data as { code: number }).code !== 0
      && 'message' in data
      && typeof (data as { message?: unknown }).message === 'string'
  }

  /**
   * 获取授权链接
   * @param type
   * @param stat 透传数据
   * @returns
   */
  async getAuthPageUrl(type: 'h5' | 'pc', stat?: string) {
    const url = `${this.hostUrl}/wxPlat/auth/url?type=${type}&key=${this.id}&stat=${stat}`
    return this.request<{
      data: string
      code: string
      messgage: string
    }>(url, { method: 'GET' }, { operation: 'getAuthPageUrl' })
  }

  /**
   * 使用获取授权
   * @param authorizationCode
   * @returns
   */
  async getQueryAuth(authorizationCode: string) {
    const url = `${this.hostUrl}/wxPlat/queryAuth/${authorizationCode}`
    const res = await this.request<{ data: WxPlatAuthorizerInfo }>(url, { method: 'GET' }, { operation: 'getQueryAuth' })
    return res.data
  }

  /**
   * 使用授权码获取授权信息
   * @param authorizerAppid
   * @returns
   */
  async getAuthorizerInfo(authorizerAppid: string) {
    const url = `${this.hostUrl}/wxPlat/authorizer/info/${authorizerAppid}`
    const res = await this.request<{ data: { nick_name: string, user_name: string, head_img: string, service_type_info: { id: number, name: string }, verify_type_info: { id: number, name: string } } }>(url, { method: 'GET' }, { operation: 'getAuthorizerInfo' })
    return res.data
  }

  /**
   * 刷新用户的authorizer_access_token
   * @param authorizerAppId 用的应用的appid
   * @param authorizerRefreshToken 刷新token
   * @returns
   */
  async getAuthorizerAccessToken(
    authorizerAppId: string,
    authorizerRefreshToken: string,
  ) {
    const url = `${this.hostUrl}/wxPlat/authorizerAccessToken`
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: { authorizerAppId, authorizerRefreshToken },
    }
    const res = await this.request<{ data: WxPlatAuthorizerInfo }>(url, config, { operation: 'getAuthorizerAccessToken' })
    return res.data
  }

  /**
   * 获取稳定版接口调用凭据（推荐使用）
   * 该接口获取的 token 与普通接口互相隔离，避免 token 冲突
   * @param authorizerAppId 授权方appid
   * @param authorizerRefreshToken 授权方刷新token
   * @returns
   */
  async getStableAuthorizerAccessToken(
    authorizerAppId: string,
    authorizerRefreshToken: string,
  ) {
    const url = `${this.hostUrl}/wxPlat/stableAuthorizerAccessToken`
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: { authorizerAppId, authorizerRefreshToken },
    }
    const res = await this.request<{ data: WxPlatAuthorizerInfo }>(url, config, { operation: 'getStableAuthorizerAccessToken' })
    return res.data
  }

  async uploadTempMedia(accessToken: string, type: MediaType, fileUrl: string) {
    this.logger.log(`[myWxPlat:uploadTempMedia] fileUrl=${fileUrl} type=${type}`)
    const res = await this.request<{ type: MediaType, media_id: string, created_at: number }>(
      `${this.hostUrl}/wxGzh/uploadTempMedia`,
      {
        method: 'POST',
        data: { accessToken, type, fileUrl },
      },
      { operation: 'uploadTempMedia' },
    )
    this.logger.log(`[myWxPlat:uploadTempMedia] result media_id=${res.media_id}`)
    return res
  }

  async getTempMedia(accessToken: string, mediaId: string) {
    this.logger.log(`[myWxPlat:getTempMedia] mediaId=${mediaId}`)
    return this.request<{ video_url?: string }>(
      `${this.hostUrl}/wxGzh/getTempMedia`,
      {
        method: 'POST',
        data: { accessToken, mediaId },
      },
      { operation: 'getTempMedia' },
    )
  }

  async uploadImg(accessToken: string, imgUrl: string) {
    this.logger.log(`[myWxPlat:uploadImg] imgUrl=${imgUrl}`)
    const res = await this.request<{ url: string }>(
      `${this.hostUrl}/wxGzh/uploadImg`,
      {
        method: 'POST',
        data: { accessToken, imgUrl },
      },
      { operation: 'uploadImg' },
    )
    this.logger.log(`[myWxPlat:uploadImg] result url=${res.url}`)
    return res
  }

  async addMaterial(
    accessToken: string,
    type: MediaType,
    fileUrl: string,
    videoOptions?: {
      title: string
      introduction?: string
    },
  ) {
    this.logger.log(`[myWxPlat:addMaterial] fileUrl=${fileUrl} type=${type}`)
    const res = await this.request<{ media_id: string, url: string, errcode?: number, errmsg?: string }>(
      `${this.hostUrl}/wxGzh/addMaterial`,
      {
        method: 'POST',
        data: { accessToken, type, fileUrl, videoOptions },
      },
      { operation: 'addMaterial' },
    )
    this.logger.log(`[myWxPlat:addMaterial] result media_id=${res.media_id} url=${res.url || ''}`)
    return res
  }

  async getMaterial(accessToken: string, mediaId: string) {
    this.logger.log(`[myWxPlat:getMaterial] mediaId=${mediaId}`)
    return this.request<unknown>(
      `${this.hostUrl}/wxGzh/getMaterial`,
      {
        method: 'POST',
        data: { accessToken, mediaId },
      },
      { operation: 'getMaterial' },
    )
  }

  async draftAdd(accessToken: string, data: WxGzhArticleNews | WxGzhArticleNewsPic) {
    this.logger.log(`[myWxPlat:draftAdd] article_type=${data.article_type} title=${data.title}`)
    const res = await this.request<{ media_id: string }>(
      `${this.hostUrl}/wxGzh/draftAdd`,
      {
        method: 'POST',
        data: { accessToken, data },
      },
      { operation: 'draftAdd' },
    )
    this.logger.log(`[myWxPlat:draftAdd] result media_id=${res.media_id}`)
    return res
  }

  async freePublish(accessToken: string, mediaId: string) {
    this.logger.log(`[myWxPlat:freePublish] mediaId=${mediaId}`)
    const res = await this.request<{ publish_id: string, msg_data_id: string }>(
      `${this.hostUrl}/wxGzh/freePublish`,
      {
        method: 'POST',
        data: { accessToken, mediaId },
      },
      { operation: 'freePublish' },
    )
    this.logger.log(`[myWxPlat:freePublish] result publish_id=${res.publish_id} msg_data_id=${res.msg_data_id}`)
    return res
  }

  async getusercumulate(accessToken: string, beginDate: string, endDate: string) {
    this.logger.log(`[myWxPlat:getusercumulate] beginDate=${beginDate} endDate=${endDate}`)
    return this.request<{ list: { ref_date: string, cumulate_user: number }[] }>(
      `${this.hostUrl}/wxGzh/getusercumulate`,
      {
        method: 'POST',
        data: { accessToken, beginDate, endDate },
      },
      { operation: 'getusercumulate' },
    )
  }

  async getuserread(accessToken: string, beginDate: string, endDate: string) {
    this.logger.log(`[myWxPlat:getuserread] beginDate=${beginDate} endDate=${endDate}`)
    return this.request<{ list: { ref_date: string, user_source: number, int_page_read_count: number, share_count: number, add_to_fav_count: number }[] }>(
      `${this.hostUrl}/wxGzh/getuserread`,
      {
        method: 'POST',
        data: { accessToken, beginDate, endDate },
      },
      { operation: 'getuserread' },
    )
  }

  async deleteArticle(accessToken: string, mediaId: string) {
    this.logger.log(`[myWxPlat:deleteArticle] mediaId=${mediaId}`)
    return this.request<unknown>(
      `${this.hostUrl}/wxGzh/deleteArticle`,
      {
        method: 'POST',
        data: { accessToken, mediaId },
      },
      { operation: 'deleteArticle' },
    )
  }
}
