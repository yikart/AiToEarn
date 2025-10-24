import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AppException } from '@yikart/common'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../common/utils/time.util'
import { config } from '../../../config'
import { AccountService } from '../../../core/account/account.service'
import { FileService } from '../../../core/file/file.service'
import { RedisService } from '../../../libs'
import { BilibiliApiService } from '../../../libs/bilibili/bilibiliApi.service'
import {
  AccessToken,
  AddArchiveData,
  ArchiveStatus,
  VideoUTypes,
} from '../../../libs/bilibili/common'
import { OAuth2Crendential } from '../../../libs/database/schema/oauth2Crendential.schema'
import {
  AccountStatus,
  AccountType,
  NewAccount,
} from '../../../transports/account/common'
import { AuthTaskInfo } from '../common'
import { BilibiliAuthInfo } from './common'

@Injectable()
export class BilibiliService {
  private readonly platform = AccountType.BILIBILI
  private readonly logger = new Logger(BilibiliService.name)
  constructor(
    private readonly redisService: RedisService,
    private readonly bilibiliApiService: BilibiliApiService,
    private readonly accountService: AccountService,
    private readonly fileService: FileService,
    @InjectModel(OAuth2Crendential.name)
    private OAuth2CrendentialModel: Model<OAuth2Crendential>,
  ) {}

  async getBilibiliConfig() {
    return config.bilibili
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:bilibili:authTask:${taskId}`
  }

  /**
   * 创建用户授权任务
   * @param data
   * @param options
   */
  async createAuthTask(
    data: {
      userId: string
      type: 'h5' | 'pc'
      spaceId: string
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
        spaceId: data.spaceId,
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
    const gourl = `${config.bilibili.authBackHost}/${taskId}`
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

  async getAccessTokenStatus(accountId: string): Promise<number> {
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (!tokenInfo)
      return 0
    const now = getCurrentTimestamp()
    return tokenInfo.expires_in > now ? 1 : 0
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
      this.logger.log('---- bilibil getAccountInfo chage face error ', error)

      bilibiliUserInfo.face = 'error'
    }

    return bilibiliUserInfo
  }

  private async saveOAuthCredential(
    accountId: string,
    accessTokenInfo: AccessToken,
  ) {
    const cached = await this.redisService.setKey(
      `${this.platform}:accessToken:${accountId}`,
      accessTokenInfo,
    )
    const persistResult = await this.OAuth2CrendentialModel.updateOne(
      {
        accountId,
        platform: this.platform,
      },
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
      },
      {
        upsert: true,
      },
    )
    const saved
      = cached
        && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
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
  ): Promise<{
    status: number
    message?: string
    accountId?: string
  }> {
    const cacheKey = this.getAuthDataCacheKey(taskId)
    const { code, state } = data

    const taskInfo
      = await this.redisService.get<AuthTaskInfo<BilibiliAuthInfo>>(cacheKey)
    if (!taskInfo || taskInfo.status !== 0) {
      return {
        status: 0,
        message: '授权超时',
      }
    }

    if (taskInfo.data?.state !== state) {
      return {
        status: 0,
        message: '授权认证失败',
      }
    }

    // 延长授权时间
    void this.redisService.setPexire(cacheKey, 60 * 3)

    // 获取token，创建账号
    const accessTokenInfo = await this.bilibiliApiService.getAccessToken(code)
    if (!accessTokenInfo) {
      return {
        status: 0,
        message: '平台认证失效',
      }
    }

    // 获取B站用户信息
    const bilibiliUserInfo = await this.getAccountInfo(
      accessTokenInfo.access_token,
    )
    if (!bilibiliUserInfo) {
      return {
        status: 0,
        message: '获取用户信息失败，请稍后再试',
      }
    }

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId: taskInfo.data.userId,
      type: AccountType.BILIBILI,
      uid: bilibiliUserInfo.openid,
      account: bilibiliUserInfo.openid,
      avatar: bilibiliUserInfo.face,
      nickname: bilibiliUserInfo.name,
      groupId: taskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })
    const accountInfo = await this.accountService.createAccount(
      taskInfo.data.userId,
      {
        type: AccountType.BILIBILI,
        uid: bilibiliUserInfo.openid,
      },
      newData,
    )
    if (!accountInfo) {
      return {
        status: 0,
        message: '创建频道账号失败',
      }
    }

    let res = await this.saveOAuthCredential(accountInfo.id, accessTokenInfo)

    if (!res) {
      return {
        status: 0,
        message: '设置授权Token失败，请稍后再试',
      }
    }

    // 更新任务信息
    taskInfo.status = 1
    taskInfo.data.accountId = accountInfo.id
    res = await this.redisService.setKey<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
      taskInfo,
      60 * 3,
    )

    return res
      ? {
          status: 1,
          accountId: accountInfo.id,
        }
      : {
          status: 0,
          message: '设置授权Token失败，请稍后再试',
        }
  }

  private async getOAuth2Credential(
    accountId: string,
  ): Promise<AccessToken | null> {
    let credential = await this.redisService.get<AccessToken>(
      `${this.platform.toLowerCase()}:accessToken:${accountId}`,
    )
    if (!credential) {
      const oauth2Credential = await this.OAuth2CrendentialModel.findOne(
        {
          accountId,
          platform: this.platform,
        },
      )
      if (!oauth2Credential) {
        return null
      }
      credential = {
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        scopes: [],
      }
    }
    return credential
  }

  /**
   * 获取用户的授权Token
   * @param accountId
   * @returns
   */
  async getAccountAccessToken(accountId: string): Promise<string> {
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      return Promise.resolve('')
    }
    if (!credential.access_token) {
      return Promise.resolve('')
    }

    // 剩余时间
    const overTime = credential.expires_in - getCurrentTimestamp()

    if (overTime > 60 * 10)
      return credential.access_token

    return await this.refreshAccessToken(accountId, credential.refresh_token)
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

    const res = await this.saveOAuthCredential(accountId, accessTokenInfo)
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

  /**
   * 删除稿件
   * @param accountId
   * @param resourceId
   * @returns
   */
  async deleteArchive(accountId: string, resourceId: string) {
    const accessToken = await this.getAccountAccessToken(accountId)
    return await this.bilibiliApiService.deleteArchive(accessToken, resourceId)
  }
}
