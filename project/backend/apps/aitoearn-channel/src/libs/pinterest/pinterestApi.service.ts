/*
 * @Author: white
 * @Date: 2025-06-20 22:42:27
 * @LastEditors: white
 * @Description: Pinterest
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import FormData from 'form-data'
import qs from 'qs'
import { config } from '../../config'
import { CreateBoardBody, CreatePinBody } from './common'
import { PinterestAPIConfig } from './constants'
import { normalizePinterestError, PinterestApiException } from './pinterest-api.exception'
import { PinterestBoard, PinterestBoardsListResponse, PinterestInitMediaUploadResponse, PinterestOAuthCredential, PinterestPin, PinterestPinsListResponse, PinterestUserAccount } from './pinterest.interfaces'
import { PinterestOperation } from './pinterest.operations'

@Injectable()
export class PinterestApiService {
  private readonly logger = new Logger(PinterestApiService.name)
  appId: string
  appSecret: string
  baseUrl: string
  redirect_uri: string

  constructor() {
    const cfg = config.pinterest
    this.appId = cfg.id
    this.appSecret = cfg.secret
    this.baseUrl = cfg.baseUrl
    this.redirect_uri = cfg.authBackHost
  }

  private async request<T = unknown>(url: string, config: AxiosRequestConfig, options: { operation?: string } = {}): Promise<T> {
    const operation = options.operation || 'pinterest request'
    this.logger.debug(`[PIN:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(`[PIN:${operation}] Response <- ${url} status=${response.status}`)
      return response.data
    }
    catch (error: unknown) {
      const normalized = normalizePinterestError(error)
      const status = normalized.status
      const message = (normalized.raw as { message?: string } | undefined)?.message || (error as Error)?.message
      this.logger.error(`[PIN:${operation}] Failed url=${url} status=${status} msg=${message}`)
      throw new PinterestApiException(operation, normalized, { url, method: config.method })
    }
  }

  /**
   * 获取用户信息 (User Account)
   * https://developers.pinterest.com/docs/api/v5/#tag/User-Account/operation/user_account/get
   */
  async getAccountInfo(accessToken: string): Promise<PinterestUserAccount> {
    const url = `${PinterestAPIConfig.userAccountURL}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<PinterestUserAccount>(url, config, { operation: PinterestOperation.GET_USER_ACCOUNT })
  }

  /**
   * 获取用户的授权Token
   * @returns
   */
  // 获取 OAuth 凭证（授权码兑换访问令牌）
  // https://developers.pinterest.com/docs/api/v5/#tag/OAuth/operation/oauth_token
  async getOAuthCredential(code: string): Promise<PinterestOAuthCredential> {
    const url = PinterestAPIConfig.oauthTokenURL
    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirect_uri,
      continuous_refresh: true,
    })
    const pwd = `${this.appId}:${this.appSecret}`
    const Authorization = `Basic ${Buffer.from(pwd).toString('base64')}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization },
      data,
    }
    return await this.request<PinterestOAuthCredential>(url, config, { operation: PinterestOperation.GET_OAUTH_CREDENTIAL })
  }

  /**
   * 刷新访问令牌
   * @param refresh_token
   */
  async refreshOAuthCredential(refresh_token: string): Promise<PinterestOAuthCredential> {
    const url = PinterestAPIConfig.oauthTokenURL
    const data = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token,
    })
    const pwd = `${this.appId}:${this.appSecret}`
    const Authorization = `Basic ${Buffer.from(pwd).toString('base64')}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization },
      data,
    }
    return await this.request<PinterestOAuthCredential>(url, config, { operation: PinterestOperation.REFRESH_OAUTH_CREDENTIAL })
  }

  /**
   * 创建 Board
   * https://developers.pinterest.com/docs/api/v5/#tag/Boards/operation/boards/create
   */
  async createBoard(body: CreateBoardBody, accessToken: string): Promise<PinterestBoard> {
    const url = PinterestAPIConfig.boardsURL
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: body,
    }
    return await this.request<PinterestBoard>(url, config, { operation: PinterestOperation.CREATE_BOARD })
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoards(accessToken: string): Promise<{ list: PinterestBoard[], count: number, bookmark?: string }> {
    const url = PinterestAPIConfig.boardsURL
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    const resp = await this.request<PinterestBoardsListResponse>(url, config, { operation: PinterestOperation.GET_BOARDS })
    const list = resp.items || []
    const count = list.length
    return { list, count, bookmark: resp.bookmark }
  }

  /**
   * 获取 Board 详情
   * https://developers.pinterest.com/docs/api/v5/#tag/Boards/operation/boards/get
   */
  async getBoardById(id: string, accessToken: string): Promise<PinterestBoard> {
    const url = `${PinterestAPIConfig.boardsURL}/${id}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    return await this.request<PinterestBoard>(url, config, { operation: PinterestOperation.GET_BOARD_DETAIL })
  }

  /**
   * 删除 Board
   * https://developers.pinterest.com/docs/api/v5/#tag/Boards/operation/boards/delete
   */
  async deleteBoard(id: string, accessToken: string): Promise<void> {
    const url = `${PinterestAPIConfig.boardsURL}/${id}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    await this.request<void>(url, config, { operation: PinterestOperation.DELETE_BOARD })
  }

  /**
   * 创建 Pin
   * https://developers.pinterest.com/docs/api/v5/#tag/Pins/operation/pins/create
   */
  async createPin(body: CreatePinBody, accessToken: string): Promise<PinterestPin> {
    const url = PinterestAPIConfig.pinsURL
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: body,
    }
    return await this.request<PinterestPin>(url, config, { operation: PinterestOperation.CREATE_PIN })
  }

  /**
   * 获取 Pin 详情
   * https://developers.pinterest.com/docs/api/v5/#tag/Pins/operation/pins/get
   */
  async getPinById(id: string, accessToken: string): Promise<PinterestPin> {
    const url = `${PinterestAPIConfig.pinsURL}/${id}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    return await this.request<PinterestPin>(url, config, { operation: PinterestOperation.GET_PIN_DETAIL })
  }

  /**
   * 获取 Pin 列表
   * https://developers.pinterest.com/docs/api/v5/#tag/Pins/operation/pins/list
   */
  async getPins(accessToken: string): Promise<{ list: PinterestPin[], count: number, bookmark?: string }> {
    const url = PinterestAPIConfig.pinsURL
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    const resp = await this.request<PinterestPinsListResponse>(url, config, { operation: PinterestOperation.GET_PINS })
    const list = resp.items || []
    const count = list.length
    return { list, count, bookmark: resp.bookmark }
  }

  /**
   * 删除 Pin
   * https://developers.pinterest.com/docs/api/v5/#tag/Pins/operation/pins/delete
   */
  async deletePin(id: string, accessToken: string): Promise<void> {
    const url = `${PinterestAPIConfig.pinsURL}/${id}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    await this.request<void>(url, config, { operation: PinterestOperation.DELETE_PIN })
  }

  /**
   * 获取视频 video_id
   * @returns
   */
  async initMediaUpload(accessToken: string): Promise<PinterestInitMediaUploadResponse> {
    const url = PinterestAPIConfig.mediaURL
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { media_type: 'video' },
    }
    return await this.request<PinterestInitMediaUploadResponse>(url, config, { operation: PinterestOperation.INIT_MEDIA_UPLOAD })
  }

  /**
   * 上传视频
   * @returns
   */
  async uploadMedia(uploadURL: string, formData: FormData): Promise<void> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      maxBodyLength: Infinity,
      url: uploadURL,
      headers: {
        ...formData.getHeaders(),
      },
      data: formData as unknown as BodyInit,
    }
    await this.request<void>(uploadURL, config, { operation: PinterestOperation.UPLOAD_MEDIA })
  }

  /**
   * 获取视频上传凭证
   * @returns
   */
  async getUploadHeaders(accessToken: string): Promise<PinterestInitMediaUploadResponse> {
    return this.initMediaUpload(accessToken)
  }
}
