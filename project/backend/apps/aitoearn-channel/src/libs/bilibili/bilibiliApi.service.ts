import { createHash, createHmac } from 'node:crypto'
/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-04-14 16:50:44
 * @LastEditors: nevin
 * @Description: Bilibili bilibili
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { getRandomString } from '../../common'
import { config } from '../../config'
import { BilibiliError } from './bilibili.exception'
import {
  AccessToken,
  AddArchiveData,
  ArchiveAddByUtokenData,
  ArchiveListData,
  ArchiveStatus,
  ArchiveTypeItem,
  ArcIncStatData,
  ArcStatData,
  BilibiliUser,
  CommonResponse,
  DeleteVideoData,
  etagData,
  GrantScopes,
  UserStatData,
  videoInitialData,
  VideoUTypes,
} from './common'

@Injectable()
export class BilibiliApiService {
  private readonly logger = new Logger(BilibiliApiService.name)
  private readonly appId: string
  private readonly appSecret: string
  private readonly provider = 'bilibili'
  constructor() {
    const cfg = config.bilibili
    this.appId = cfg.id
    this.appSecret = cfg.secret
  }

  getAppInfo() {
    return {
      appId: this.appId,
      appSecret: this.appSecret,
    }
  }

  private generateOperation(url: string, method: string) {
    return `${method} ${url.split('?')?.[0]?.split('.com')?.[1] || 'unknown'}`
  }

  private async request<T>(url: string, config: AxiosRequestConfig = {}): Promise<CommonResponse<T>> {
    const method = (config.method || 'GET').toUpperCase()
    const operation = this.generateOperation(url, method)
    this.logger.debug(`Bilibili API Request: ${operation}, params=${config.params ? JSON.stringify(config.params) : '{}'} `)
    try {
      const response: AxiosResponse<CommonResponse<T>> = await axios(url, config)
      if (response.data && response.data.code !== 0) {
        throw BilibiliError.buildFromResponse(response.data, operation)
      }
      return response.data
    }
    catch (error) {
      const err = BilibiliError.buildFromError(error, operation)
      this.logger.error(`Bilibili API Error: ${operation} message=${err.message} status=${err.status} rawError=${JSON.stringify(err.rawError)}`)
      throw err
    }
  }

  /**
   * 获取登陆授权页
   * @param redirectURL 回调地址
   * @param type 回调地址
   * @returns
   */
  getAuthPage(redirectURL: string, type: 'h5' | 'pc') {
    const state = getRandomString(8)
    const url
      = type === 'h5'
        ? `https://account.bilibili.com/h5/account-h5/auth/oauth?navhide=1&callback=skip&gourl=${redirectURL}&client_id=${this.appId}&state=${state}`
        : `https://account.bilibili.com/pc/account-pc/auth/oauth?client_id=${this.appId}&gourl=${redirectURL}&state=${state}`

    return {
      url,
      state,
    }
  }

  /**
   * 设置用户的授权Token
   * @param data
   * @returns
   */
  async getAccessToken(code: string) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      params: {
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        code,
      },
    }

    const resp = await this.request<AccessToken>('https://api.bilibili.com/x/account-oauth2/v1/token', config)
    return resp.data
  }

  /**
   * 刷新授权Token
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(refreshToken: string): Promise<AccessToken | null> {
    const url = `https://api.bilibili.com/x/account-oauth2/v1/refresh_token`
    const config: AxiosRequestConfig = {
      method: 'POST',
      params: {
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    }
    const resp = await this.request<AccessToken>(url, config)
    return resp.data
  }

  /**
   * 生成请求头
   * @param data
   */
  generateHeader(
    data: {
      accessToken: string
      body?: { [key: string]: any }
    },
    isForm = false,
  ) {
    const { accessToken, body } = data

    const md5Str = body ? JSON.stringify(body) : ''
    const xBiliContentMd5 = createHash('md5').update(md5Str).digest('hex')

    const header = {
      'Accept': 'application/json',
      'Content-Type': isForm ? 'multipart/form-data' : 'application/json', // 或者 multipart/form-data
      'x-bili-content-md5': xBiliContentMd5,
      'x-bili-timestamp': Math.floor(Date.now() / 1000),
      'x-bili-signature-method': 'HMAC-SHA256',
      'x-bili-signature-nonce': uuidv4(),
      'x-bili-accesskeyid': this.appId,
      'x-bili-signature-version': '2.0',
      'access-token': accessToken, // 需要在请求头中添加access-token
      'Authorization': '',
    }

    // 抽取带"x-bili-"前缀的自定义header，按字典排序拼接，构建完整的待签名字符串：
    // 待签名字符串包含换行符\n
    const headerStr = Object.keys(header)
      .filter(key => key.startsWith('x-bili-'))
      .sort()
      .map(key => `${key}:${header[key]}`)
      .join('\n')

    // 使用 createHmac 正确创建签名
    const signature = createHmac('sha256', this.appSecret)
      .update(headerStr)
      .digest('hex')

    // 将签名加入 header
    header.Authorization = signature

    return header
  }

  /**
   * 获取授权用户信息
   * @param accessToken
   * @returns
   */
  async getAccountInfo(accessToken: string): Promise<BilibiliUser | null> {
    const url = `https://member.bilibili.com/arcopen/fn/user/account/info`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }
    const resp = await this.request<BilibiliUser>(url, config)
    return resp.data
  }

  /**
   * 查询用户已授权权限列表
   * @param accessToken
   * @returns
   */
  async getAccountScopes(accessToken: string) {
    const url = `https://member.bilibili.com/arcopen/fn/user/account/scopes`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }

    const resp = await this.request<GrantScopes>(url, config)
    return resp.data
  }

  /**
   * 视频初始化
   * @param accessToken
   * @param fileName
   * @param utype // 1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(
    accessToken: string,
    fileName: string,
    utype: VideoUTypes = 0,
  ): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/video/init`
    const data = {
      name: fileName, // test.mp4
      utype: `${utype}`,
    }
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken, body: data }),
      data,
    }
    const resp = await this.request<videoInitialData>(url, config)
    return resp.data.upload_token
  }

  /**
   * 视频分片上传
   * @param accessToken
   * @param file
   * @param uploadToken
   * @param partNumber
   * @returns
   */
  async uploadVideoPart(
    accessToken: string,
    file: Buffer,
    uploadToken: string,
    partNumber: number,
  ) {
    const url = `https://openupos.bilivideo.com/video/v2/part/upload`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken }),
      params: {
        upload_token: uploadToken,
        part_number: partNumber,
      },
      data: file,
    }
    const result = await this.request<etagData>(url, config)
    return result.data.etag
  }

  /**
   * 文件分片合片
   * @param accessToken
   * @param uploadToken
   * @returns
   */
  async videoComplete(accessToken: string, uploadToken: string) {
    const url = `https://member.bilibili.com/arcopen/fn/archive/video/complete`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken }),
      params: {
        upload_token: uploadToken,
      },
    }
    return await this.request<unknown>(url, config)
  }

  /**
   * 封面上传
   * @param accessToken
   * @param fileBase64
   * @returns
   */
  async coverUpload(accessToken: string, fileBase64: string): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/cover/upload`
    const buffer = Buffer.from(fileBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('file', blob)
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken }, true),
      data: formData,
    }
    const resp = await this.request<{ url: string }>(url, config)
    return resp.data.url
  }

  /**
   * 小视频上传 100M以下
   * @param accessToken
   * @param file
   * @param uploadToken
   * @returns
   */
  async uploadLitVideo(accessToken: string, file: Buffer, uploadToken: string) {
    const url = `https://openupos.bilivideo.com/video/v2/upload?upload_token=${uploadToken}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken }),
      data: file,
    }
    return await this.request<unknown>(url, config)
  }

  /**
   * 视频稿件提交
   * @param accessToken
   * @param uploadToken
   * @param inData
   * @returns
   */
  async archiveAddByUtoken(
    accessToken: string,
    uploadToken: string,
    inData: AddArchiveData,
  ): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/add-by-utoken`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken, body: inData }),
      params: { upload_token: uploadToken },
      data: inData,
    }
    const result = await this.request<ArchiveAddByUtokenData>(url, config)
    return result.data.resource_id
  }

  /**
   * 分区查询
   * @param accessToken
   * @returns
   */
  async archiveTypeList(accessToken: string): Promise<ArchiveTypeItem[]> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/type/list`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }
    const result = await this.request<ArchiveTypeItem[]>(url, config)
    return result.data
  }

  /**
   * 获取稿件列表
   * @param accessToken
   * @param params
   * 可选值：all(全部)，is_pubing(发布中)，pubed(已发布)，not_pubed(未发布)。不填查询全部
   * @returns
   */
  async getArchiveList(
    accessToken: string,
    params: {
      ps: number
      pn: number
      status?: ArchiveStatus
    },
  ): Promise<ArchiveListData> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/viewlist`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
      params,
    }
    const result = await this.request<ArchiveListData>(url, config)
    return result.data
  }

  /**
   * 获取用户数据
   * @param accessToken
   * @returns
   */
  async getUserStat(accessToken: string): Promise<UserStatData> {
    const url = `https://member.bilibili.com/arcopen/fn/data/user/stat`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }
    const result = await this.request<UserStatData>(url, config)
    return result.data
  }

  /**
   * 获取稿件数据
   * @param accessToken
   * @param resourceId
   * @returns
   */
  async getArcStat(
    accessToken: string,
    resourceId: string,
  ): Promise<ArcStatData> {
    const url = `https://member.bilibili.com/arcopen/fn/data/arc/stat?resource_id=${resourceId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }
    const result = await this.request<ArcStatData>(url, config)
    return result.data
  }

  /**
   * 获取稿件增量数据数据
   * @param accessToken
   * @returns
   */
  async getArcIncStat(accessToken: string): Promise<ArcIncStatData> {
    const url = `https://member.bilibili.com/arcopen/fn/data/arc/inc-stats`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: this.generateHeader({ accessToken }),
    }
    const result = await this.request<ArcIncStatData>(url, config)
    return result.data
  }

  async deleteArchive(accessToken: string, videoId: string): Promise<CommonResponse<DeleteVideoData>> {
    const url = 'https://member.bilibili.com/arcopen/fn/archive/delete'
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: this.generateHeader({ accessToken }),
      data: {
        resource_id: videoId,
      },
    }
    const result = await this.request<DeleteVideoData>(url, config)
    return result
  }
}
