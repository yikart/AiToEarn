import { BilibiliAuthInfo } from '@core/plat/bilibili/common'
import { AuthTaskInfo } from '@core/plat/common'
import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentTimestamp } from '@/common'
import { AccountService } from '@/core/account/account.service'
import { RedisService } from '@/libs'
import { KwaiAccessTokenResponse, KwaiVideoPubParams } from '@/libs/kwai/kwaiApi.interfaces'
import { KwaiApiService } from '@/libs/kwai/kwaiApi.service'
import { AccountStatus, AccountType, NewAccount } from '@/transports/account/common'

@Injectable()
export class KwaiService {
  constructor(
    private readonly kwaiApiService: KwaiApiService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
  ) { }

  // 根据accountID获取 AccessToken
  async getAccountTokenInfo(accountId: string) {
    return await this.redisService.get<KwaiAccessTokenResponse>(
      `kwai:accessToken:${accountId}`,
    )
  }

  // 设置 AccessToken
  async setAccountTokenInfo(
    key: string,
    accountTokenInfo: KwaiAccessTokenResponse,
  ) {
    const expires = accountTokenInfo.refresh_token_expires_in
    accountTokenInfo.refresh_token_expires_in
      = getCurrentTimestamp() + accountTokenInfo.refresh_token_expires_in
    accountTokenInfo.expires_in
      = getCurrentTimestamp() + accountTokenInfo.expires_in

    return await this.redisService.setKey(key, accountTokenInfo, expires)
  }

  /**
   * 获取AccessToken并且刷新Token
   * @param accountId
   */
  async getAccessTokenAndRefresh(accountId: string) {
    const accessTokenInfo = await this.getAccountTokenInfo(accountId)
    if (!accessTokenInfo)
      return null

    // 判断 refresh_token 是否过期
    const refreshOverTime
      = accessTokenInfo.refresh_token_expires_in - getCurrentTimestamp()
    if (refreshOverTime <= 0)
      return null

    // 判断 access_token 是否过期
    const accessOverTime = accessTokenInfo.expires_in - getCurrentTimestamp()
    if (accessOverTime > 60 * 10)
      return accessTokenInfo.access_token

    // 刷新 accountToken
    const newAccountToken = await this.kwaiApiService.refreshToken(
      accessTokenInfo.refresh_token,
    )
    if (!newAccountToken)
      return null

    const isSuccess = await this.setAccountTokenInfo(
      `kwai:accessToken:${accountId}`,
      newAccountToken,
    )
    return isSuccess ? newAccountToken.access_token : null
  }

  private getAuthDataCacheKey(taskId: string) {
    return `channel:kwai:authTask:${taskId}`
  }

  /**
   * 创建用户授权任务
   * @returns
   * @param data
   * @param options
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
    const urlInfo = this.kwaiApiService.getAuthPage(taskId, data.type)
    const rRes = await this.redisService.setKey<AuthTaskInfo<BilibiliAuthInfo>>(
      this.getAuthDataCacheKey(taskId),
      {
        taskId,
        transpond: options?.transpond,
        accountAddPath: options?.accountAddPath,
        data: {
          state: '',
          userId: data.userId,
        },
        status: 0,
      },
      60 * 5,
    )

    return rRes
      ? {
          url: urlInfo,
          taskId,
        }
      : null
  }

  async createAccountAndSetAccessToken(taskId: string, data: { code: string, state: string }) {
    const cacheKey = this.getAuthDataCacheKey(taskId)
    const { code } = data
    const taskInfo = await this.redisService.get<AuthTaskInfo<BilibiliAuthInfo>>(
      cacheKey,
    )
    if (!taskInfo || taskInfo.status !== 0 || !taskInfo.data)
      return { status: 0, message: '任务不存在或已完成' }

    // 延长授权时间
    void this.redisService.setPexire(cacheKey, 60 * 3)

    try {
      const account = await this.addKwaiAccount(code, taskInfo.data.userId)
      if (account) {
        // 更新任务信息
        taskInfo.status = 1
        taskInfo.data['accountId'] = account.id
        await this.redisService.setKey<AuthTaskInfo<BilibiliAuthInfo>>(
          cacheKey,
          taskInfo,
          60 * 3,
        )
        return { status: 1, message: '添加账号成功', accountId: account.id }
      }
      else {
        return { status: 0, message: '添加账号失败' }
      }
    }
    catch (error) {
      Logger.error('createAccountAndSetAccessToken error:', error)
      return { status: 0, message: `添加账号失败: ${error.message}` }
    }
  }

  async getAuthInfo(taskId: string) {
    return await this.redisService.get<{
      state: string
      status: number
      accountId?: string
    }>(this.getAuthDataCacheKey(taskId))
  }

  // 根据code添加快手账户
  async addKwaiAccount(code: string, userId: string) {
    Logger.log(code, userId)
    // 获取快手token
    const accountTokenInfo
      = await this.kwaiApiService.getLoginAccountToken(code)
    if (!accountTokenInfo)
      throw new Error('获取快手token失败')

    // 获取快手用户信息
    const kwaiUserInfo = await this.kwaiApiService.getAccountInfo({
      accessToken: accountTokenInfo.access_token,
    })
    if (!kwaiUserInfo)
      throw new Error('快手用户信息获取失败')

    // 创建本平台的平台账号
    const newData = new NewAccount({
      userId,
      type: AccountType.KWAI,
      uid: accountTokenInfo.open_id,
      account: accountTokenInfo.open_id,
      avatar: kwaiUserInfo.bigHead,
      nickname: kwaiUserInfo.name,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.accountService.createAccount(
      {
        userId,
        type: AccountType.KWAI,
        uid: accountTokenInfo.open_id,
      },
      newData,
    )
    if (!accountInfo)
      throw new Error('添加账号失败')

    const res = await this.setAccountTokenInfo(
      `kwai:accessToken:${accountInfo.id}`,
      accountTokenInfo,
    )

    if (!res)
      throw new Error('设置redis失败')

    return accountInfo
  }

  // 视频发布
  async videoPub(accountId: string, pubParams: KwaiVideoPubParams) {
    const accountToken = await this.getAccessTokenAndRefresh(accountId)
    if (accountToken === null) {
      throw new Error('快手账户过期')
    }
    return await this.kwaiApiService.publishVideo(accountToken, pubParams)
  }
}
