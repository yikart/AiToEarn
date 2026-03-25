import * as fs from 'node:fs'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, getErrorMessage, ResponseCode, stringifyError } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import axios, { AxiosResponse, isAxiosError } from 'axios'
import FormData from 'form-data'
import * as _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import {
  AuthInfo,
  CreateBoardBody,
  CreatePinBody,
  ILoginStatus,
} from '../../libs/pinterest/common'
import { PinterestApiService } from '../../libs/pinterest/pinterest-api.service'
import { PinterestInitMediaUploadResponse } from '../../libs/pinterest/pinterest.interfaces'
import { WebhookDto } from '../../platforms/pinterest/pinterest.dto'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { META_TIME_CONSTANTS } from '../meta/constants'
import { PlatformAuthExpiredException } from '../platform.exception'

@Injectable()
export class PinterestService extends PlatformBaseService {
  protected override readonly platform: string = AccountType.PINTEREST
  protected override readonly logger = new Logger(PinterestService.name)
  private readonly redirectURL = config.channel.pinterest.authBackHost
  private readonly client_id = config.channel.pinterest.id

  constructor(
    private readonly pinterestApiService: PinterestApiService,
    @Inject(RedisService)
    private readonly redisService: RedisService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  private async saveOAuthCredential(accountId: string, tokenInfo: {
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  }, rawPayload?: unknown): Promise<boolean> {
    const now = getCurrentTimestamp()
    const accessTokenExpiresAt = now + tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const refreshTokenExpiresAt = tokenInfo.refresh_token_expires_in
      ? now + tokenInfo.refresh_token_expires_in
      : undefined

    const cacheData: AuthInfo = {
      status: ILoginStatus.success,
      accountId,
      access_token: tokenInfo.access_token,
      expires_in: accessTokenExpiresAt,
      refresh_token_expires_in: refreshTokenExpiresAt,
    }
    const cached = await this.redisService.setJson(ChannelRedisKeys.accessToken('pinterest', accountId), cacheData)

    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      AccountType.PINTEREST,
      {
        accessToken: tokenInfo.access_token,
        refreshToken: tokenInfo.refresh_token || '',
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        raw: JSON.stringify(rawPayload ?? tokenInfo),
      },
    )

    return cached && persistResult
  }

  private async getOAuth2Credential(accountId: string): Promise<AuthInfo | null> {
    let credential = await this.redisService.getJson<AuthInfo>(ChannelRedisKeys.accessToken('pinterest', accountId))
    if (!credential) {
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        AccountType.PINTEREST,
      )
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential = {
        status: ILoginStatus.success,
        accountId,
        access_token: oauth2Credential.accessToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
        refresh_token_expires_in: oauth2Credential.refreshTokenExpiresAt,
      }
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  } | null> {
    try {
      const refreshed = await this.pinterestApiService.refreshOAuthCredential(refresh_token)
      return refreshed
    }
    catch (error) {
      this.logger.error('----- pinterest Error refreshOAuthCredential: ----', getErrorMessage(error))
      return null
    }
  }

  private async authorize(accountId: string): Promise<AuthInfo | null> {
    const credential = await this.getOAuth2Credential(accountId)
    const now = getCurrentTimestamp()
    if (credential && credential.expires_in && now >= credential.expires_in) {
      // attempt refresh using DB-stored refresh token
      const dbRecord = await this.oauth2CredentialRepository.getOne(accountId, AccountType.PINTEREST)
      const refreshToken = dbRecord?.refreshToken
      if (!refreshToken || refreshToken.trim() === '') {
        this.logger.error(`No refresh token found for accountId: ${accountId}`)
        return null
      }
      const refreshed = await this.refreshOAuthCredential(refreshToken)
      if (!refreshed) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      const saved = await this.saveOAuthCredential(accountId, {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || refreshToken,
        expires_in: refreshed.expires_in,
        refresh_token_expires_in: refreshed.refresh_token_expires_in,
      }, refreshed)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      const updated = await this.getOAuth2Credential(accountId)
      return updated
    }
    return credential
  }

  /**
   * 创建board
   * @param body
   * @returns
   */
  async createBoard(body: CreateBoardBody) {
    this.logger.log(JSON.stringify(body))
    const accountId: string = _.get(body, 'accountId') || ''
    _.unset(body, 'accountId')
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    this.logger.log(JSON.stringify(body))
    return this.pinterestApiService.createBoard(body, accessToken)
  }

  /**
   * 获取board列表信息
   * @returns
   */
  async getBoardList(accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getBoards(accessToken)
  }

  /**
   * 获取board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async getBoardById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getBoardById(id, accessToken)
  }

  /**
   * 删除board信息
   * @param id board id
   * @param accountId
   * @returns
   */
  async delBoardById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.deleteBoard(id, accessToken)
  }

  /**
   * 创建pin
   * @param body
   * @returns
   */
  async createPin(data: CreatePinBody) {
    this.logger.debug({
      path: '--- pinterest createPin --- 1 入参',
      data: {
        accountId: data.accountId,
        boardId: data.board_id,
        title: data.title,
        mediaSource: data.media_source,
      },
    })

    let tokenInfo: AuthInfo
    try {
      tokenInfo = await this.getUserStat(data.accountId || '')
      this.logger.debug({
        path: '--- pinterest createPin --- 2 getUserStat 成功',
        data: {
          hasAccessToken: !!tokenInfo?.access_token,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest createPin --- 2 getUserStat 失败',
        data: {
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          fullError: stringifyError(error),
        },
      })
      throw error
    }

    const accessToken = tokenInfo.access_token as string

    this.logger.debug({
      path: '--- pinterest createPin --- 3 调用 API 前',
      data: {
        accountId: data.accountId,
        boardId: data.board_id,
      },
    })

    try {
      const result = await this.pinterestApiService.createPin(data, accessToken)
      this.logger.debug({
        path: '--- pinterest createPin --- 4 API 调用成功',
        data: {
          pinId: result?.id,
          result,
        },
      })
      return result
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest createPin --- 4 API 调用失败',
        data: {
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          errorStatus: isAxiosError(error) ? error.status : undefined,
          errorResponse: isAxiosError(error) ? error.response?.data : undefined,
          fullError: stringifyError(error),
        },
      })
      throw error
    }
  }

  /**
   * 获取pin信息
   * @param id pin id
   * @param accountId
   * @returns
   */
  async getPinById(id: string, accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getPinById(id, accessToken)
  }

  /**
   * 获取pin列表信息
   * @param accountId 签名
   * @returns
   */
  async getPinList(accountId: string) {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    return this.pinterestApiService.getPins(accessToken)
  }

  /**
   * 删除pin
   * @param id pin id
   * @param accountId
   * @returns
   */
  override async deletePost(accountId: string, postId: string): Promise<boolean> {
    const tokenInfo = await this.getUserStat(accountId)
    const accessToken = tokenInfo.access_token as string
    await this.pinterestApiService.deletePin(postId, accessToken)
    return true
  }

  /**
   * 获取授权地址
   * @param userId userId
   * @returns
   */
  async getAuth(userId: string, spaceId = '', callbackUrl?: string, callbackMethod?: 'GET' | 'POST') {
    if (!config.channel.pinterest.id && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidv4().replace(/-/g, '')
    const redisKeyByTaskId = ChannelRedisKeys.authTask('pinterest', taskId)
    const scope
      = 'scope=boards:read,boards:write,pins:write,pins:read,catalogs:read,catalogs:write,pins:write_secret,pins:read_secret,user_accounts:read'
    const path = `response_type=code&redirect_uri=${this.redirectURL}&client_id=${this.client_id}&${scope}&state=${taskId}`
    const uri = `https://www.pinterest.com/oauth/?${path}`
    const tokenInfo = { taskId, userId, status: ILoginStatus.wait, spaceId, callbackUrl, callbackMethod }
    await this.redisService.setJson(redisKeyByTaskId, tokenInfo, 60 * 5)
    return { taskId, userId, status: ILoginStatus.wait, uri }
  }

  async authWebhook(data: WebhookDto) {
    const { code, state } = data
    try {
      const result = await this.pinterestApiService.getOAuthCredential(code || '')
      const { access_token, expires_in, refresh_token_expires_in } = result
      const userInfo
        = await this.pinterestApiService.getAccountInfo(access_token)
      // 获取到token后第一时间创建account信息
      const redisKeyByTaskId = ChannelRedisKeys.authTask('pinterest', state || '')
      const redisCache
        = await this.redisService.getJson<AuthInfo & { spaceId?: string }>(redisKeyByTaskId)
      if (!redisCache) {
        return {
          status: 0,
          message: '授权信息已过期',
        }
      }
      const { userId } = redisCache
      if (!userId) {
        return {
          status: 0,
          message: '授权信息已过期',
        }
      }
      // 创建本平台的平台账号
      const newData = new NewAccount({
        userId,
        type: AccountType.PINTEREST,
        uid: userInfo.id,
        avatar: userInfo.profile_image,
        nickname: userInfo.username,
        account: userInfo.id,
        groupId: redisCache.spaceId,
        status: AccountStatus.NORMAL,
      })
      this.logger.log('NewAccount-data', JSON.stringify(newData))
      const accountInfo = await this.channelAccountService.createAccount(
        {
          type: AccountType.PINTEREST,
          uid: userInfo.id,
        },
        newData,
      )
      if (!accountInfo) {
        return {
          status: 0,
          message: '添加账号失败',
        }
      }
      const tokenSaved = await this.saveOAuthCredential(
        accountInfo.id,
        {
          access_token,
          refresh_token: result.refresh_token,
          expires_in,
          refresh_token_expires_in,
        },
        result,
      )
      if (!tokenSaved) {
        this.logger.error(`Failed to save pinterest token for accountId: ${accountInfo.id}`)
        return {
          status: 0,
          message: '保存访问令牌失败',
        }
      }
      // 更新任务信息
      const authDataCache = { taskId: state, status: ILoginStatus.success }
      await this.redisService.setJson(redisKeyByTaskId, authDataCache, 5 * 60)
      return {
        status: 1,
        message: '授权成功',
        accountId: accountInfo.id,
        nickname: accountInfo.nickname,
        avatar: accountInfo.avatar,
        platformUid: accountInfo.uid,
        accountType: AccountType.PINTEREST,
        callbackUrl: redisCache.callbackUrl,
        callbackMethod: redisCache.callbackMethod,
        taskId: state,
      }
    }
    catch (error) {
      this.logger.error('----- pinterest Error authWebhook: ----', (error as Error).message)
      return {
        status: 0,
        message: `获取授权失败: ${(error as Error).message}`,
      }
    }
  }

  /**
   * 查询授权状态
   * @param taskId taskId
   * @returns
   */
  async checkAuth(taskId: string) {
    const redisKeyByTaskId = ChannelRedisKeys.authTask('pinterest', taskId)
    const tokenInfo: AuthInfo | null
      = await this.redisService.getJson<AuthInfo>(redisKeyByTaskId)
    if (_.isEmpty(tokenInfo))
      return { taskId, status: ILoginStatus.expired }
    const { status } = tokenInfo
    return { taskId, status }
  }

  async getAccessToken(accountId: string) {
    await this.ensureLocalAccount(accountId)
    const credential = await this.authorize(accountId)
    if (!credential || !credential.access_token) {
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credential.access_token}`,
    }
  }

  async uploadVideo(videoUrl: string, accountId: string) {
    this.logger.debug({
      path: '--- pinterest uploadVideo --- 1 入参',
      data: {
        videoUrl,
        accountId,
      },
    })

    // 获取视频的上传凭证
    let tokenInfo: AuthInfo
    try {
      tokenInfo = await this.getUserStat(accountId)
      this.logger.debug({
        path: '--- pinterest uploadVideo --- 2 getUserStat 成功',
        data: {
          hasAccessToken: !!tokenInfo?.access_token,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest uploadVideo --- 2 getUserStat 失败',
        data: {
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          fullError: stringifyError(error),
        },
      })
      throw error
    }

    const accessToken = tokenInfo.access_token as string

    // 获取视频文件
    this.logger.debug({
      path: '--- pinterest uploadVideo --- 3 下载视频前',
      data: {
        videoUrl,
      },
    })

    let remoteResponse: AxiosResponse
    try {
      remoteResponse = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
      })
      this.logger.debug({
        path: '--- pinterest uploadVideo --- 4 下载视频成功',
        data: {
          statusCode: remoteResponse?.status,
          contentType: remoteResponse?.headers?.['content-type'],
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest uploadVideo --- 4 下载视频失败',
        data: {
          videoUrl,
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          fullError: stringifyError(error),
        },
      })
      throw error
    }

    const path = videoUrl.split('/').pop() || 'pinterest_upload_video'
    remoteResponse.data.pipe(fs.createWriteStream(path))

    this.logger.debug({
      path: '--- pinterest uploadVideo --- 5 获取上传凭证前',
      data: {
        localPath: path,
      },
    })

    // 创建文件视频流
    const formData = new FormData()
    let result: PinterestInitMediaUploadResponse
    try {
      result = await this.pinterestApiService.getUploadHeaders(accessToken)
      this.logger.debug({
        path: '--- pinterest uploadVideo --- 6 获取上传凭证成功',
        data: {
          mediaId: result?.media_id,
          uploadUrl: result?.upload_url,
          hasUploadParameters: !!result?.upload_parameters,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest uploadVideo --- 6 获取上传凭证失败',
        data: {
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          errorResponse: isAxiosError(error) ? error.response?.data : undefined,
          fullError: stringifyError(error),
        },
      })
      throw error
    }

    const { upload_parameters: headers, upload_url, media_id } = result

    // 添加文件流
    _.mapKeys(headers, (v, k) => {
      formData.append(k, v)
    })
    formData.append('file', fs.createReadStream(path))

    this.logger.debug({
      path: '--- pinterest uploadVideo --- 7 上传媒体前',
      data: {
        uploadUrl: upload_url,
        mediaId: media_id,
        localPath: path,
      },
    })

    try {
      await this.pinterestApiService.uploadMedia(upload_url, formData)
      this.logger.debug({
        path: '--- pinterest uploadVideo --- 8 上传媒体成功',
        data: {
          mediaId: media_id,
        },
      })
    }
    catch (error) {
      this.logger.error({
        path: '--- pinterest uploadVideo --- 8 上传媒体失败',
        data: {
          uploadUrl: upload_url,
          mediaId: media_id,
          errorMessage: getErrorMessage(error),
          errorName: error instanceof Error ? error.name : undefined,
          errorResponse: isAxiosError(error) ? error.response?.data : undefined,
          fullError: stringifyError(error),
        },
      })
      // 清理临时文件
      try {
        fs.unlinkSync(path)
      }
      catch {
        // ignore cleanup error
      }
      throw error
    }

    fs.unlinkSync(path)

    this.logger.debug({
      path: '--- pinterest uploadVideo --- 9 完成',
      data: {
        mediaId: media_id,
      },
    })

    return {
      data: { media_id },
      code: 0,
    }
  }

  async getUserStat(accountId: string) {
    const credential = await this.authorize(accountId)
    if (!credential || !credential.access_token) {
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
    return credential
  }

  /**
   * 获取当前授权账号的用户信息
   * 复用 getUserStat 校验与获取 token，避免重复代码
   */
  async getUserInfo(accountId: string) {
    try {
      const tokenInfo = await this.getUserStat(accountId)
      const { access_token } = tokenInfo
      if (!access_token) {
        throw new AppException(ResponseCode.ChannelAuthorizationExpired)
      }
      const userInfo = await this.pinterestApiService.getAccountInfo(access_token)
      return userInfo
    }
    catch (error) {
      this.logger.error('----- pinterest Error getUserInfo: ----', getErrorMessage(error))
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }
  }

  async getAccessTokenStatus(accountId: string) {
    await this.ensureLocalAccount(accountId)
    const tokenInfo = await this.getOAuth2Credential(accountId)
    if (_.isEmpty(tokenInfo) || !tokenInfo?.expires_in) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    const status = tokenInfo.expires_in > getCurrentTimestamp() ? 1 : 0

    // 更新状态
    this.updateAccountStatus(accountId, status)
    return status
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const pinId = this.parsePinterestUrl(workLink)
    const resolvedDataId = pinId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析 Pinterest URL，提取 Pin ID
   * 支持的 URL 格式：
   * - https://www.pinterest.com/pin/PIN_ID
   * - https://pin.it/SHORT_CODE
   * - https://www.pinterest.com/pin/PIN_ID/
   * @param workLink Pinterest 链接
   * @returns pinId 或 null
   */
  private parsePinterestUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '')

    if (hostname === 'pinterest.com' || hostname.endsWith('.pinterest.com')) {
      const pathname = url.pathname
      // https://www.pinterest.com/pin/PIN_ID
      if (pathname.startsWith('/pin/')) {
        return pathname.split('/pin/')[1]?.split(/[?&#/]/)[0] || null
      }
    }
    else if (hostname === 'pin.it') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }

    return null
  }
}
