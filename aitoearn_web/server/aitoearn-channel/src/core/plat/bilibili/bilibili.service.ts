import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { AppException, getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { FileService } from '@/core/file/file.service'
import { RedisService } from '@/libs'
import { BilibiliApiService } from '@/libs/bilibili/bilibiliApi.service'
import {
  AccessToken,
  AddArchiveData,
  ArchiveStatus,
  VideoUTypes,
} from '@/libs/bilibili/comment'
import { AccountType, NewAccount } from '@/transports/account/common'
import { AuthTaskInfo } from '../common'
import { BilibiliAuthInfo } from './common'

@Injectable()
export class BilibiliService {
  private authBackHost = ''
  constructor(
    private readonly redisService: RedisService,
    private readonly bilibiliApiService: BilibiliApiService,
    private readonly accountService: AccountService,
    private readonly fileService: FileService,
  ) {
    this.authBackHost = config.bilibili.authBackHost
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:bilibili:authTask:${taskId}`
  }

  /**
   * 创建用户授权任务
   */
  async createAuthTask(
    data: {
      userId: string
      type: 'h5' | 'pc'
    },
    options?: {
      transpond?: string
      accountAddPath?: string
    },
  ) {
    const taskId = uuidv4()
    const urlInfo = await this.getAuthUrl(taskId, data.type)
    const rRes = await this.redisService.setKey<AuthTaskInfo<BilibiliAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
      {
        taskId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          state: urlInfo.state,
          userId: data.userId,
        },
        status: 0,
      },
      60 * 5,
    )

    return rRes
      ? {
          url: urlInfo.url,
          taskId,
        }
      : null
  }

  /**
   * 获取用户的授权链接
   * @param taskId
   * @param type
   * @returns
   */
  async getAuthUrl(taskId: string, type: 'h5' | 'pc') {
    const gourl = `${this.authBackHost}/${taskId}`
    const urlInfo = this.bilibiliApiService.getAuthPage(gourl, type)
    return urlInfo
  }

  /**
   * 获取用户的授权信息
   * @param taskId
   * @returns
   */
  async getAuthInfo(taskId: string) {
    const data = await this.redisService.get<{
      state: string
      status: number
      accountId?: string
    }>(this.getAuthDataCacheKey(taskId))
    return data
  }

  /**
   * 获取用户的授权信息
   * @param accountId
   * @returns
   */
  async getAccountAuthInfo(accountId: string) {
    const data = await this.redisService.get<AccessToken>(
      `bilibili:accessToken:${accountId}`,
    )
    return data
  }

  /**
   * 获取请求头
   * @param accountId
   * @param data
   * @returns
   */
  async generateHeader(
    accountId: string,
    data: {
      body?: { [key: string]: any }
      isForm?: boolean
    },
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)

    const headerData = {
      accessToken,
      ...data,
    }
    return this.bilibiliApiService.generateHeader(headerData)
  }

  /**
   * 获取用户信息
   * @param userId
   * @returns
   */
  async getAccountInfo(accessToken: string) {
    const bilibiliUserInfo
      = await this.bilibiliApiService.getAccountInfo(accessToken)
    if (!bilibiliUserInfo)
      return null

    try {
      const newPath = await this.fileService.upFileByUrl(
        bilibiliUserInfo.face,
        {
          path: 'account/avatar',
          permanent: true,
        },
      )

      bilibiliUserInfo.face = newPath
    }
    catch (error) {
      Logger.log('---- bilibil getAccountInfo chage face error ', error)

      bilibiliUserInfo.face = 'error'
    }

    return bilibiliUserInfo
  }

  /**
   * 创建账号+设置授权Token
   * @param taskId
   * @param data
   * @returns
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    data: { code: string, state: string },
  ) {
    const cacheKey = this.getAuthDataCacheKey(taskId)
    const { code, state } = data

    const taskInfo = await this.redisService.get<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
    )
    if (!taskInfo || taskInfo.status !== 0)
      return null

    if (taskInfo.data?.state !== state)
      return null

    // 延长授权时间
    void this.redisService.setPexire(cacheKey, 60 * 3)

    // 获取token，创建账号
    const accessTokenInfo = await this.bilibiliApiService.getAccessToken(code)
    if (!accessTokenInfo)
      return null

    // 获取B站用户信息
    const bilibiliUserInfo = await this.getAccountInfo(
      accessTokenInfo.access_token,
    )
    if (!bilibiliUserInfo)
      return null

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId: taskInfo.data.userId,
      type: AccountType.BILIBILI,
      uid: bilibiliUserInfo.openid,
      account: bilibiliUserInfo.openid,
      avatar: bilibiliUserInfo.face,
      nickname: bilibiliUserInfo.name,
    })
    const accountInfo = await this.accountService.createAccount(
      {
        userId: taskInfo.data.userId,
        type: AccountType.BILIBILI,
        uid: bilibiliUserInfo.openid,
      },
      newData,
    )
    if (!accountInfo)
      return null

    const expires
      = accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 10

    let res = await this.redisService.setKey(
      `bilibili:accessToken:${accountInfo.id}`,
      accessTokenInfo,
      expires,
    )

    if (!res)
      return null

    // 更新任务信息
    taskInfo.status = 1
    taskInfo.data.accountId = accountInfo.id
    res = await this.redisService.setKey<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
      taskInfo,
      60 * 3,
    )

    return res ? accountInfo : null
  }

  /**
   * 获取用户的授权Token
   * @param accountId
   * @returns
   */
  async getAccountAccessToken(accountId: string): Promise<string> {
    const res = await this.redisService.get<AccessToken>(
      `bilibili:accessToken:${accountId}`,
    )
    if (!res)
      return ''

    // 剩余时间
    const overTime = res.expires_in - getCurrentTimestamp()

    if (overTime > 60 * 10)
      return res.access_token

    return await this.refreshAccessToken(accountId, res.refresh_token)
  }

  /**
   * 刷新AccessToken
   * @param userId
   * @param refreshToken
   * @returns
   */
  private async refreshAccessToken(
    accountId: string,
    refreshToken: string,
  ): Promise<string> {
    const accessTokenInfo
      = await this.bilibiliApiService.refreshAccessToken(refreshToken)
    if (!accessTokenInfo)
      return ''

    const expires
      = accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 10
    const res = await this.redisService.setKey(
      `bilibili:accessToken:${accountId}`,
      accessTokenInfo,
      expires,
    )
    if (!res)
      return ''

    return accessTokenInfo.access_token
  }

  /**
   * 查询用户已授权权限列表
   * @returns
   */
  async getAccountScopes(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    const res = await this.bilibiliApiService.getAccountScopes(accessToken)
    return res
  }

  /**
   * 视频初始化
   * @param accountId
   * @param fileName
   * @param utype // 1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(
    accountId: string,
    fileName: string,
    utype: VideoUTypes = 0,
  ): Promise<string> {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')
    return this.bilibiliApiService.videoInit(accessToken, fileName, utype)
  }

  /**
   * 文件分片上传
   * @param accountId 账户ID
   * @param fileBuffer
   * @param uploadToken
   * @param partNumber
   */
  async uploadVideoPart(
    accountId: string,
    fileBuffer: Buffer,
    uploadToken: string,
    partNumber: number,
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    return await this.bilibiliApiService.uploadVideoPart(
      accessToken,
      fileBuffer,
      uploadToken,
      partNumber,
    )
  }

  /**
   * 文件分片合片
   * @param accountId 账户ID
   * @param file base64 字符串
   */
  async videoComplete(accountId: string, uploadToken: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    const res = await this.bilibiliApiService.videoComplete(
      accessToken,
      uploadToken,
    )

    return res
  }

  /**
   * 封面上传
   * @param accountId 账户ID
   * @param fileBase64 base64 字符串
   */
  async coverUpload(accountId: string, fileBase64: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    const res = await this.bilibiliApiService.coverUpload(
      accessToken,
      fileBase64,
    )

    return res
  }

  /**
   * 小视频上传 100M以下
   * @param accountId 账户ID
   * @param file base64 字符串
   * @param uploadToken 上传标识
   */
  async uploadLitVideo(
    accountId: string,
    fileBase64: string,
    uploadToken: string,
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)
    if (!accessToken)
      throw new AppException(10010, '账号有误')

    const file = Buffer.from(fileBase64, 'base64')
    const res = await this.bilibiliApiService.uploadLitVideo(
      accessToken,
      file,
      uploadToken,
    )

    return res
  }

  /**
   * 视频稿件提交
   * @param accessToken
   * @param uploadToken
   * @param data
   * @returns
   */
  async archiveAddByUtoken(
    accountId: string,
    uploadToken: string,
    data: AddArchiveData,
  ): Promise<string> {
    const accessToken = await this.getAccountAccessToken(accountId)

    return this.bilibiliApiService.archiveAddByUtoken(
      accessToken,
      uploadToken,
      data,
    )
  }

  /**
   * 分区查询
   * @param accountId
   * @returns
   */
  async archiveTypeList(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.archiveTypeList(accessToken)
  }

  /**
   * 获取稿件列表
   * @param accountId
   * @returns
   */
  async getArchiveList(
    accountId: string,
    params: {
      ps: number
      pn: number
      status?: ArchiveStatus
    },
  ) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArchiveList(accessToken, params)
  }

  /**
   * 获取用户数据
   * @param accountId
   * @returns
   */
  async getUserStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getUserStat(accessToken)
  }

  /**
   * 获取稿件数据
   * @param accountId
   * @param resourceId
   * @returns
   */
  async getArcStat(accountId: string, resourceId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArcStat(accessToken, resourceId)
  }

  /**
   * 获取稿件增量数据数据
   * @param accountId
   * @returns
   */
  async getArcIncStat(accountId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.getArcIncStat(accessToken)
  }
}
