import { createHash, createHmac } from 'node:crypto'
/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-04-14 16:50:44
 * @LastEditors: nevin
 * @Description: Bilibili bilibili
 */
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { getRandomString } from '@/common'
import { config } from '@/config'
import {
  AccessToken,
  AddArchiveData,
  ArchiveStatus,
  BilibiliUser,
  VideoUTypes,
} from './comment'

@Injectable()
export class BilibiliApiService {
  appId: string
  appSecret: string
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

  /**
   * 获取登陆授权页
   * @param gourl 回调地址
   * @param type 回调地址
   * @returns
   */
  getAuthPage(gourl: string, type: 'h5' | 'pc') {
    const state = getRandomString(8)
    const url
      = type === 'h5'
        ? `https://account.bilibili.com/h5/account-h5/auth/oauth?navhide=1&callback=close&gourl=${gourl}&client_id=${this.appId}&state=${state}`
        : `https://account.bilibili.com/pc/account-pc/auth/oauth?client_id=${this.appId}&gourl=${gourl}&state=${state}`

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
    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        data: AccessToken
      }>('https://api.bilibili.com/x/account-oauth2/v1/token', null, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'authorization_code',
          code,
        },
      })
      if (result.data.code !== 0)
        throw new Error(result.data.message)

      return result.data.data
    }
    catch (error) {
      console.error('----- BiliBili Error getUserAccessToken: ----', error)
      return null
    }
  }

  /**
   * 刷新授权Token
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(refreshToken: string): Promise<AccessToken | null> {
    const url = `https://api.bilibili.com/x/account-oauth2/v1/refresh_token`
    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        data: AccessToken
      }>(url, null, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      })
      if (result.data.code !== 0)
        throw new Error(result.data.message)

      return result.data.data
    }
    catch (error) {
      console.error('Error during getAccessToken:', error)
      return null
    }
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
    try {
      const result = await axios.get<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        data: BilibiliUser
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
      })

      if (result.data.code !== 0)
        throw new Error(result.data.message)

      return result.data.data
    }
    catch (error) {
      console.error('------ error Bilibil getAccountInfo: ----', error)
      return null
    }
  }

  /**
   * 查询用户已授权权限列表
   * @param accessToken
   * @returns
   */
  async getAccountScopes(accessToken: string) {
    try {
      const result = await axios.get<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        data: {
          openid: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
          scopes: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
        }
      }>(`https://member.bilibili.com/arcopen/fn/user/account/scopes`, {
        headers: this.generateHeader({
          accessToken,
        }),
      })
      if (result.data.code !== 0) {
        throw new Error(result.data.message)
      }

      return result.data.data
    }
    catch (error) {
      console.error('---- bilibili get scopes error ----', error)
      return null
    }
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
    const body = {
      name: fileName, // test.mp4
      utype: `${utype}`,
    }

    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        request_id: string // '7b753a287405461f5afa526a1f672094';
        data: {
          upload_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
        }
      }>(`https://member.bilibili.com/arcopen/fn/archive/video/init`, body, {
        headers: this.generateHeader({
          accessToken,
          body,
        }),
      })
      if (result.data.code !== 0)
        throw new Error(result.data.message)

      return result.data.data.upload_token
    }
    catch (error) {
      console.error('-- error bilibili videoInit --', error)

      return ''
    }
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
    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
        data: {
          etag: string // '"137c00d459a744318385fc5339f26a70"';
        }
        ttl: number // 1;
      }>(
        `https://openupos.bilivideo.com/video/v2/part/upload?upload_token=${uploadToken}&part_number=${partNumber}`,
        file,
        {
          headers: this.generateHeader({
            accessToken,
          }),
        },
      )
      if (result.data.code !== 0)
        throw new Error(result.data.message)

      return result.data
    }
    catch (error) {
      console.error('-------- error bilibili uploadPart ------', error)

      return {
        code: 1,
        message: '上传失败',
      }
    }
  }

  /**
   * 文件分片合片
   * @param accessToken
   * @param uploadToken
   * @returns
   */
  async videoComplete(accessToken: string, uploadToken: string) {
    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
      }>(
        `https://member.bilibili.com/arcopen/fn/archive/video/complete?upload_token=${uploadToken}`,
        undefined,
        {
          headers: this.generateHeader({
            accessToken,
          }),
        },
      )

      return result.data
    }
    catch (error) {
      console.error('-------- error bilibili videoComplete ------', error)

      return {
        code: 1,
        message: '合并失败',
      }
    }
  }

  /**
   * 封面上传
   * @param accessToken
   * @param fileBase64
   * @returns
   */
  async coverUpload(accessToken: string, fileBase64: string): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/cover/upload`
    try {
      const buffer = Buffer.from(fileBase64, 'base64')
      const blob = new Blob([buffer], { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', blob)

      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        request_id: string // '7b753a287405461f5afa526a1f672094';
        data: {
          url: string // "https://archive.biliimg.com/bfs/..."
        }
      }>(url, formData, {
        headers: this.generateHeader(
          {
            accessToken,
          },
          true,
        ),
      })

      if (result.data.code !== 0) {
        throw new Error(result.data.message)
      }
      return result.data.data.url
    }
    catch (error) {
      console.error('-------- error bilibili coverUpload ------', error)
      return ''
    }
  }

  /**
   * 小视频上传 100M以下
   * @param accessToken
   * @param file
   * @param uploadToken
   * @returns
   */
  async uploadLitVideo(accessToken: string, file: Buffer, uploadToken: string) {
    try {
      const result = await axios.post<{
        code: number // 0;
        message: string // '0';
      }>(
        `https://https://openupos.bilivideo.com/video/v2/upload?upload_token=${uploadToken}`,
        file,
        {
          headers: this.generateHeader({
            accessToken,
          }),
        },
      )

      return result.data
    }
    catch (error) {
      console.error('-------- error bilibili uploadPart ------', error)

      return {
        code: 1,
        message: '上传失败',
      }
    }
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

    const result = await axios.post<{
      code: number // 0;
      message: string // '0';
      ttl: number // 1;
      data: {
        resource_id: string // 'BV17B4y1s7R1';
      }
    }>(url, inData, {
      headers: this.generateHeader({
        accessToken,
        body: inData,
      }),
      params: {
        upload_token: uploadToken,
      },
    })
    Logger.log(`发布：`, result.data)
    Logger.log('发布参数：', inData)

    const { code, message, data } = result.data
    if (code !== 0) {
      throw new Error(message)
    }

    return data.resource_id
  }

  /**
   * 分区查询
   * @param accessToken
   * @returns
   */
  async archiveTypeList(accessToken: string) {
    try {
      const url = `https://member.bilibili.com/arcopen/fn/archive/type/list`

      const result = await axios.get<{
        code: number // 0;
        message: string // '0';
        ttl: number // 1;
        request_id: string // '35f4a1e0d3765a92510f919d0b6721dd';
        data: any
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
      })
      if (result.data.code !== 0) {
        throw new Error(result.data.message)
      }

      return result.data.data
    }
    catch (error) {
      console.error('-------- bilibili archiveTypeList error ------', error)
      return null
    }
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
  ) {
    try {
      const url = `https://member.bilibili.com/arcopen/fn/archive/viewlist`

      const result = await axios.get<{
        code: number // 0;
        data: {
          list: {
            addit_info: {
              reject_reason: string // '';
              state: number // 0;
              state_desc: string // ''开放浏览';
            }
            copyright: number // 1;
            cover: string // ''http://i0.hdslb.com/bfs/archive/72d5d38d3bd4c30639d0d6a5e8e2b9cf86d088f7.jpg';
            ctime: number // 1729154751;
            desc: string // ''';
            no_reprint: number // 1;
            ptime: number // 1729154822;
            resource_id: string // ''BV1MW421X7gM';
            tag: string // ''生活记录';
            tid: number // 229;
            title: string // ''test';
            video_info: {
              cid: number // 26300318231;
              duration: number // 5;
              filename: string // ''n241017sa380ea181vd6us3f37wq4m3k';
              iframe_url: string // ''player.bilibili.com/player.html?aid=1856655535&bvid=BV1MW421X7gM&cid=26300318231&page=1';
              share_url: string // ''https://www.bilibili.com/video/BV1MW421X7gM?share_source=open_plat';
            }
          }[]
          page: {
            pn: number // 1;
            ps: number // 20;
            total: number // 5;
          }
        }
        message: string // '0';
        request_id: string // '758996376ea6bd2d3e4f7654d06721f2';
        ttl: number // 1;
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
        params,
      })
      return result.data.data
    }
    catch (error) {
      console.error('-------- getArchiveList bilibili error ------', error)
      return {
        list: [],
        page: {
          pn: params.pn,
          ps: params.ps,
          total: 0,
        },
      }
    }
  }

  /**
   * 获取用户数据
   * @param accessToken
   * @returns
   */
  async getUserStat(accessToken: string): Promise<{
    arc_passed_total: number // 2;
    follower: number // 50;
    following: number // 234;
  }> {
    try {
      const url = `https://member.bilibili.com/arcopen/fn/data/user/stat`

      const result = await axios.get<{
        code: number // 0;
        data: {
          arc_passed_total: number // 2;
          follower: number // 50;
          following: number // 234;
        }
        message: string // '0';
        request_id: string // '758996376ea6bd2d3e4f7654d06721f2';
        ttl: number // 1;
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
      })
      return result.data.data
    }
    catch (error) {
      console.error('-------- getUserStat bilibili error ------', error)
      return {
        arc_passed_total: 0,
        follower: 0,
        following: 0,
      }
    }
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
  ): Promise<{
    coin: number // 0;
    danmaku: number // 0;
    favorite: number // 0;
    like: number // 0;
    ptime: number // 1729154822;
    reply: number // 0;
    share: number // 0;
    title: string // 'openplat测试稿件-hehehe';
    view: number // 29;
  }> {
    try {
      const url = `https://member.bilibili.com/arcopen/fn/data/arc/stat?resource_id=${resourceId}`

      const result = await axios.get<{
        code: number // 0;
        data: {
          coin: number // 0;
          danmaku: number // 0;
          favorite: number // 0;
          like: number // 0;
          ptime: number // 1729154822;
          reply: number // 0;
          share: number // 0;
          title: string // 'openplat测试稿件-hehehe';
          view: number // 29;
        }
        message: string // '0';
        request_id: string // '758996376ea6bd2d3e4f7654d06721f2';
        ttl: number // 1;
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
      })
      return result.data.data
    }
    catch (error) {
      console.error('-------- getArcStat bilibili error ------', error)
      return {
        coin: 0,
        danmaku: 0,
        favorite: 0,
        like: 0,
        ptime: 0,
        reply: 0,
        share: 0,
        title: '',
        view: 0,
      }
    }
  }

  /**
   * 获取稿件增量数据数据
   * @param accessToken
   * @returns
   */
  async getArcIncStat(accessToken: string): Promise<{
    inc_click: number // 53;
    inc_coin: number // 0;
    inc_dm: number // 0;
    inc_elec: number // 0;
    inc_fav: number // 0;
    inc_like: number // 0;
    inc_reply: number // 1;
    inc_share: number // 0;
  }> {
    try {
      const url = `https://member.bilibili.com/arcopen/fn/data/arc/inc-stats`

      const result = await axios.get<{
        code: number // 0;
        data: {
          inc_click: number // 53;
          inc_coin: number // 0;
          inc_dm: number // 0;
          inc_elec: number // 0;
          inc_fav: number // 0;
          inc_like: number // 0;
          inc_reply: number // 1;
          inc_share: number // 0;
        }
        message: string // '0';
        request_id: string // '758996376ea6bd2d3e4f7654d06721f2';
        ttl: number // 1;
      }>(url, {
        headers: this.generateHeader({
          accessToken,
        }),
      })
      return result.data.data
    }
    catch (error) {
      console.error('-------- getUserStat bilibili error ------', error)
      return {
        inc_click: 0,
        inc_coin: 0,
        inc_dm: 0,
        inc_elec: 0,
        inc_fav: 0,
        inc_like: 0,
        inc_reply: 0,
        inc_share: 0,
      }
    }
  }
}
