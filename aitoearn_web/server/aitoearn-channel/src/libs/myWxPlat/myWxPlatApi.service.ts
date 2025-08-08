/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: MyWxPlat
 */
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { config } from '@/config'
import { WxPlatAuthorizerInfo } from './comment'

@Injectable()
export class MyWxPlatApiService {
  private id = ''
  private secret = ''
  private hostUrl = ''
  constructor() {
    const cfg = config.myWxPlat
    this.id = cfg.id
    this.secret = cfg.secret
    this.hostUrl = cfg.hostUrl
  }

  /**
   * 获取授权链接
   * @param type
   * @param stat 透传数据
   * @returns
   */
  async getAuthPageUrl(type: 'h5' | 'pc', stat?: string) {
    try {
      const result = await axios.get<{
        data: string
        code: string
        messgage: string
      }>(
        `${this.hostUrl}/wxPlat/auth/url?type=${type}&key=${this.id}&stat=${stat}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'secret': this.secret,
          },
        },
      )
      if (result.data.code)
        throw new Error(result.data.messgage)

      return result.data.data
    }
    catch (error) {
      Logger.error('------ Error wxPlat getAuthPageUrl: ------', error)
      return null
    }
  }

  /**
   * 使用获取授权
   * @param authorizationCode
   * @returns
   */
  async getQueryAuth(authorizationCode: string) {
    try {
      const result = await axios.get<{
        data: WxPlatAuthorizerInfo
        code: string
        messgage: string
      }

      >(
        `${this.hostUrl}/wxPlat/queryAuth/${authorizationCode}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'secret': this.secret,
          },
        },
      )
      if (result.data.code)
        throw new Error(result.data.messgage)

      return result.data.data
    }
    catch (error) {
      Logger.error('------ Error wxPlat getQueryAuth: ------', error)
      return null
    }
  }

  /**
   * 使用授权码获取授权信息
   * @param authorizerAppid
   * @returns
   */
  async getAuthorizerInfo(authorizerAppid: string) {
    try {
      const result = await axios.get(
        `${this.hostUrl}/wxPlat/authorizer/info/${authorizerAppid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'secret': this.secret,
          },
        },
      )

      if (result.data.code)
        throw new Error(result.data.messgage)

      return result.data.data
    }
    catch (error) {
      Logger.error('------ Error wxPlat getAuthorizerInfo: ------', error)
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
    authorizerAppId: string,
    authorizerRefreshToken: string,
  ) {
    try {
      const result = await axios.get(
        `${this.hostUrl}/wxPlat/authorizerAccessToken`,
        {
          headers: {
            'Content-Type': 'application/json',
            'secret': this.secret,
          },
          params: { authorizerAppId, authorizerRefreshToken },
        },
      )

      if (result.data.code)
        throw new Error(result.data.messgage)

      return result.data.data
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
}
