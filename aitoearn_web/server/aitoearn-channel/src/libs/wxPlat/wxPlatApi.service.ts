/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: WxPlat
 */
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { config } from '@/config'
import { WxPlatAuthorizerInfo } from './comment'

@Injectable()
export class WxPlatApiService {
  private id = ''
  private secret = ''
  constructor() {
    const cfg = config.wxPlat

    this.id = cfg.id
    this.secret = cfg.secret
  }

  /**
   * 设置component_access_token企业授权token
   * componentVerifyTicket
   * @returns
   */
  async getComponentAccessToken(componentVerifyTicket: string): Promise<{
    component_access_token: string
    expires_in: number // 有效期，单位：秒
  } | null> {
    try {
      const result = await axios.post<{
        component_access_token: string
        expires_in: number // 有效期，单位：秒
        errcode?: number
        errmsg?: string
      }>('https://api.weixin.qq.com/cgi-bin/component/api_component_token', {
        component_appid: this.id,
        component_appsecret: this.secret,
        component_verify_ticket: componentVerifyTicket,
      })

      if (result.data.errcode)
        throw new Error(result.data.errcode + (result.data.errmsg || ''))
      return result.data
    }
    catch (error) {
      Logger.error(
        '------ Error wxPlat getComponentAccessToken: ------',
        error,
      )
      return null
    }
  }

  /**
   * 获取预授权码
   * @returns
   */
  async getPreAuthCode(componentAccessToken: string) {
    try {
      const result = await axios.post<{
        pre_auth_code: string
        expires_in: number // 有效期 1800，单位：秒
        errcode?: number
        errmsg?: string
      }>(
        `https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=${componentAccessToken}`,
        {
          component_appid: this.id,
        },
      )
      if (result.data.errcode)
        throw new Error(result.data.errcode + (result.data.errmsg || ''))
      return result.data
    }
    catch (error) {
      Logger.error('------ Error wxPlat getPreAuthCode: ------', error)
      return null
    }
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
    try {
      const result = await axios.post<{
        authorization_info: WxPlatAuthorizerInfo
      }>(
        `https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=${componentAccessToken}`,
        {
          component_appid: this.id,
          authorization_code: authorizationCode,
        },
      )

      return result.data.authorization_info
    }
    catch (error) {
      Logger.error('------ Error wxPlat getQueryAuth: ------', error)
      return null
    }
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
    try {
      const result = await axios.post<{
        authorizer_access_token: string
        authorizer_refresh_token: string
        expires_in: number // 有效期，单位：秒 2小时
        errcode?: number
        errmsg?: string
      }>(
        `https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=${componentAccessToken}`,
        {
          component_appid: this.id,
          authorizer_appid: authorizerAppId,
          authorizer_refresh_token: authorizerRefreshToken,
        },
      )

      if (result.data.errcode)
        throw new Error(result.data.errcode + (result.data.errmsg || ''))
      return result.data
    }
    catch (error) {
      Logger.error(
        '------ Error wxPlat getAuthorizerAccessToken: ------',
        error,
      )

      return null
    }
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
    try {
      const result = await axios.post<{
        authorization_info: WxPlatAuthorizerInfo
        errcode?: number
        errmsg?: string
      }>(
        `https://api.weixin.qq.com/cgi-bin/component/api_query_auth?access_token==${componentAccessToken}`,
        {
          component_appid: this.id,
          authorization_code: authorizationCode,
        },
      )
      if (result.data.errcode)
        throw new Error(result.data.errcode + (result.data.errmsg || ''))
      return result.data
    }
    catch (error) {
      Logger.log('Error setUserAppAccessTokenInfo :', error)
      return null
    }
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
    Logger.debug('getAuthorizerInfo---args', {
      componentAccessToken,
      authorizerAppid,
    })
    try {
      const result = await axios.post<{
        authorizer_info: {
          nick_name: string
          user_name: string
          head_img: string
          errcode?: number
          errmsg?: string
        }
      }>(
        `https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?access_token=${componentAccessToken}`,
        {
          component_appid: this.id,
          authorizer_appid: authorizerAppid,
        },
      )

      return result.data.authorizer_info
    }
    catch (error) {
      Logger.error('Error getAuthorizerInfo :', error)
      return null
    }
  }
}
