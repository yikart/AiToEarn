/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: MyWxPlat
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { WxGZHError } from '../wx-gzh/wx-gzh.exception'
import { WxPlatAuthorizerInfo } from './comment'

@Injectable()
export class MyWxPlatApiService {
  private id = ''
  private secret = ''
  private hostUrl = ''
  private readonly logger = new Logger(MyWxPlatApiService.name)
  constructor() {
    const cfg = config.myWxPlat
    this.id = cfg.id
    this.secret = cfg.secret
    this.hostUrl = cfg.hostUrl
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
      return response.data
    }
    catch (error: unknown) {
      const err = WxGZHError.buildFromError(error, operation)
      this.logger.error(`[myWxPlat:${operation}] Error !! ${url} message=${err.message} status=${err.status} rawError=${JSON.stringify(err.rawError)}`)
      throw err
    }
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
    return this.request<WxPlatAuthorizerInfo>(url, { method: 'GET' }, { operation: 'getQueryAuth' })
  }

  /**
   * 使用授权码获取授权信息
   * @param authorizerAppid
   * @returns
   */
  async getAuthorizerInfo(authorizerAppid: string) {
    const url = `${this.hostUrl}/wxPlat/authorizer/info/${authorizerAppid}`
    return this.request<{
      nick_name: string
      user_name: string
      head_img: string
    }>(url, { method: 'GET' }, { operation: 'getAuthorizerInfo' })
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
    return this.request<any>(url, config, { operation: 'getAuthorizerAccessToken' })
  }

  /**
   * 获取用户的授权信息
   * @param componentAccessToken
   * @param authorizationCode
   * @returns
   */
  async setUserAppAccessTokenInfo(
    componentAccessToken: string,
    authorizationCode: string,
  ) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_query_auth?access_token==${componentAccessToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
        authorization_code: authorizationCode,
      },
    }
    return this.request<{
      authorization_info: WxPlatAuthorizerInfo
    }>(url, config, { operation: 'setUserAppAccessTokenInfo' })
  }
}
