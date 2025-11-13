/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxPlat
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { WxGZHError } from '../wx-gzh/wx-gzh.exception'
import { WechatApiResponse, WxPlatAuthorizerInfo } from './comment'

@Injectable()
export class WxPlatApiService {
  private id = ''
  private secret = ''

  private readonly logger = new Logger(WxPlatApiService.name)
  constructor() {
    const cfg = config.wxPlat

    this.id = cfg.id
    this.secret = cfg.secret
  }

  private async request<T>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    const operation = options.operation || 'myWxPlat request'
    this.logger.debug(`[myWxPlat:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<WechatApiResponse<T>> = await axios(url, config)
      if (response.data && response.data.errcode) {
        throw WxGZHError.buildFromResponse(response.data, operation)
      }
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
   * 设置component_access_token企业授权token
   * componentVerifyTicket
   * @returns
   */
  async getComponentAccessToken(componentVerifyTicket: string): Promise<{
    component_access_token: string
    expires_in: number // 有效期，单位：秒
  }> {
    const url = 'https://api.weixin.qq.com/cgi-bin/component/api_component_token'
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
        component_appsecret: this.secret,
        component_verify_ticket: componentVerifyTicket,
      },
    }
    return this.request<{
      component_access_token: string
      expires_in: number
    }>(url, config, { operation: 'getComponentAccessToken' })
  }

  /**
   * 获取预授权码
   * @returns
   */
  async getPreAuthCode(componentAccessToken: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=${componentAccessToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
      },
    }
    return this.request<{
      pre_auth_code: string
      expires_in: number // 有效期 1800，单位：秒
    }>(url, config, { operation: 'getPreAuthCode' })
  }

  /**
   * 获取授权链接
   * @param preAuthCode
   * @param redirectUri
   * @param type
   * @returns
   */
  getAuthPageUrl(preAuthCode: string, redirectUri: string, type: 'h5' | 'pc') {
    const url
      = type === 'pc'
        ? `https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${this.id}&pre_auth_code=${preAuthCode}&redirect_uri=${redirectUri}&auth_type=1`
        : `https://open.weixin.qq.com/wxaopen/safe/bindcomponent?action=bindcomponent&no_scan=1&component_appid=${this.id}&pre_auth_code=${preAuthCode}&redirect_uri=${redirectUri}&auth_type=1#wechat_redirect`
    return url
  }

  /**
   * 使用授权码获取授权信息
   * @param componentAccessToken
   * @param authorizationCode
   * @returns
   */
  async getQueryAuth(componentAccessToken: string, authorizationCode: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=${componentAccessToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
        authorization_code: authorizationCode,
      },
    }
    return this.request<{
      authorization_info: WxPlatAuthorizerInfo
    }>(url, config, { operation: 'getQueryAuth' })
  }

  /**
   * 刷新用户的authorizer_access_token
   * @param componentAccessToken
   * @param appId 用的应用的appid
   * @param authorizerRefreshToken 刷新token
   * @returns
   */
  async getAuthorizerAccessToken(
    componentAccessToken: string,
    authorizerAppId: string,
    authorizerRefreshToken: string,
  ) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=${componentAccessToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
        authorizer_appid: authorizerAppId,
        authorizer_refresh_token: authorizerRefreshToken,
      },
    }
    return this.request<{
      authorizer_access_token: string
      authorizer_refresh_token: string
      expires_in: number // 有效期，单位：秒 2小时
    }>(url, config, { operation: 'getAuthorizerAccessToken' })
  }

  /**
   * 获取用户的授权信息
   * @param userId
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

  /**
   * 获取授权账号的详情
   * @param componentAccessToken
   * @param authorizerAppid
   * @returns
   */
  async getAuthorizerInfo(
    componentAccessToken: string,
    authorizerAppid: string,
  ) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?access_token=${componentAccessToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: {
        component_appid: this.id,
        authorizer_appid: authorizerAppid,
      },
    }
    return this.request<{
      authorizer_info: {
        nick_name: string
        user_name: string
        head_img: string
      }
    }>(url, config, { operation: 'getAuthorizerInfo' })
  }
}
