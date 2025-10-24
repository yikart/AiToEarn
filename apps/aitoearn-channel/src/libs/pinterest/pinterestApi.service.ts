/*
 * @Author: white
 * @Date: 2025-06-20 22:42:27
 * @LastEditors: white
 * @Description: Pinterest
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import * as _ from 'lodash'
import { base64encode } from 'nodejs-base64'
import qs from 'qs'
import { config } from '../../config'

import {
  CreateBoardBody,
  CreatePinBody,
  UserInfo,
} from './common'

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

  /**
   * 获取用户信息
   * @param access_token
   * @returns
   */
  async getAccountInfo(access_token: string): Promise<UserInfo> {
    const uri = `${this.baseUrl}/v5/user_account?`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    }
    const response: AxiosResponse<UserInfo> = await axios
      .get(uri, { headers })

    return response.data
  }

  /**
   * 获取用户的授权Token
   * @returns
   */
  async authWebhook(code: string) {
    const uri = `${this.baseUrl}/v5/oauth/token`
    const body = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirect_uri,
      continuous_refresh: true,
    })
    const pwd = `${this.appId}:${this.appSecret}`
    const Authorization = `Basic ${base64encode(pwd)}`
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization,
    }

    const result: any = await axios
      .post(uri, body, { headers })
      .catch((err: any) => {
        return this.logger.error(
          '----- pinterest Error getAccessToken: ----',
          err,
        )
      })
    if (!result?.data || !result?.data.access_token) {
      this.logger.log(result)
      throw new Error(result)
    }

    return result.data
  }

  /**
   * 创建board
   * @param body
   * @param headers
   * @returns
   */
  async createBoard(body: CreateBoardBody, headers: any) {
    const uri = `${this.baseUrl}/v5/boards`
    const result: any = await axios
      .post(uri, body, { headers })
      .catch((err: any) => {
        this.logger.error(
          '----- pinterest Error createBoard: ----',
          err.message,
        )
        return { data: { message: '名称重复' } }
      })
    return result.data
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(headers: any) {
    const uri = `${this.baseUrl}/v5/boards`
    const result: any = await axios.get(uri, { headers }).catch((err: any) => {
      return this.logger.error(
        '----- pinterest Error getBoardList: ----',
        err,
      )
    })
    const list = _.get(result, 'data.items')
    const count = _.size(list)
    return { list, count }
  }

  /**
   * 获取board信息
   * @param id board id
   * @param headers
   * @returns
   */
  async getBoardById(id: string, headers: any) {
    const uri = `${this.baseUrl}/v5/boards/${id}`
    const result: any = await axios.get(uri, { headers }).catch((err: any) => {
      return this.logger.error(
        '----- pinterest Error getBoardById: ----',
        err.message,
      )
    })
    return result.data
  }

  /**
   * 删除board信息
   * @param id board id
   * @param headers
   * @returns
   */
  async delBoardById(id: string, headers: any) {
    const uri = `${this.baseUrl}/v5/boards/${id}`
    const result: any = await axios
      .delete(uri, { headers })
      .catch((err: any) => {
        return this.logger.error(
          '----- pinterest Error delBoardById: ----',
          err.message,
        )
      })
    return result.data
  }

  /**
   * 创建pin
   * @param body
   * @param headers
   * @returns
   */
  async createPin(body: CreatePinBody, headers: any) {
    const uri = `${this.baseUrl}/v5/pins`
    const result: any = await axios
      .post(uri, body, { headers })
      .catch((err: any) => {
        this.logger.log(
          '----- pinterest Error createPin: ----',
          err.code,
        )
        return { data: { message: err } }
      })
    return result.data
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param headers
   * @returns
   */
  async getPinById(id: string, headers: any) {
    const uri = `${this.baseUrl}/v5/pins/${id}`
    const result: any = await axios.get(uri, { headers }).catch((err: any) => {
      return this.logger.error(
        '----- pinterest Error getPinById: ----',
        err.message,
      )
    })
    return result.data
  }

  /**
   * 获取pin列表信息
   * @returns
   */
  async getPinList(headers: any) {
    const uri = `${this.baseUrl}/v5/pins`
    const result: any = await axios.get(uri, { headers }).catch((err: any) => {
      return this.logger.error(
        '----- pinterest Error getPinList: ----',
        JSON.stringify(err),
      )
    })
    const list = _.get(result, 'data.items') || []
    const count = _.size(list)
    return { list, count }
  }

  /**
   * 删除pin
   * @param id pin id
   * @param headers
   * @returns
   */
  async delPinById(id: string, headers: any) {
    const uri = `${this.baseUrl}/v5/pins/${id}`
    const result: any = await axios
      .delete(uri, { headers })
      .catch((err: any) => {
        return this.logger.error(
          '----- pinterest Error delPinById: ----',
          err.message,
        )
      })
    return result.data
  }

  /**
   * 获取视频 video_id
   * @returns
   */
  async getVideoId(headers: any) {
    const uri = `${this.baseUrl}/v5/media`
    const body = { media_type: 'video' }
    const result: any = await axios.post(uri, body, { headers })
      .catch((err: any) => {
        this.logger.log('----- pinterest Error getVideoId: ----', err.message)
        return [err.message]
      })
    return result
  }

  /**
   * 上传视频
   * @returns
   */
  async uploadVideo(upload_url: string, formData: any) {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: upload_url,
      headers: {
        ...formData.getHeaders(),
      },
      data: formData,
    }
    const result: any = await axios.request(config)
      .catch((err: any) => {
        this.logger.log('----- pinterest Error uploadVideo: ----', err.message())
        return err
      })
    return result
  }

  /**
   * 获取视频上传凭证
   * @returns
   */
  async getUploadHeaders(headers: any) {
    const uri = `${this.baseUrl}/v5/media`
    const body = { media_type: 'video' }
    const result: any = await axios.post(uri, body, { headers })
      .catch((err: any) => {
        return this.logger.log('----- pinterest Error getUploadHeaders: ----', err.message)
      })
    return result.data
  }
}
