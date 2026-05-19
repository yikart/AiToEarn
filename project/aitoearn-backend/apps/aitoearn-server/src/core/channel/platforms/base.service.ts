import type { Account } from '@yikart/mongodb'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { OAuth2CredentialRepository } from '@yikart/channel-db'
import { AccountType, AppException, ResponseCode, WorkStatus } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import axios from 'axios'
import { RelayAccountException } from '../../../core/relay/relay-account.exception'

/**
 * 作品详情信息（用于创建发布记录）
 */
export interface WorkDetailInfo {
  dataId: string // 作品ID
  title?: string // 标题
  desc?: string // 描述
  topics?: string[] // 话题标签
  coverUrl?: string // 封面URL
  videoUrl?: string // 视频URL
  imgUrlList?: string[] // 图片列表
  publishTime?: Date // 发布时间
  type: string // 作品类型（video/image�?
  videoType?: 'short' | 'long' // 视频类型
  duration?: number // 视频时长（秒�?
  rawData?: Record<string, unknown> // 原始API返回数据
}

export interface ValidatedWorkInfo {
  dataId: string
  uniqueId: string
  type: string
  videoType?: 'short' | 'long'
  resolvedUrl?: string
  workDetail?: WorkDetailInfo
}

export interface WorkLinkInfo {
  dataId: string
  uniqueId: string
  type: string
  videoType?: 'short' | 'long'
  resolvedUrl?: string
  originalWorkLink?: string
  workStatus?: WorkStatus.LINK_ERROR
}

export interface AccountAuthStatistics {
  fansCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  commentCount?: number
  workCount?: number
}

@Injectable()
export abstract class PlatformBaseService {
  protected readonly platform: string = 'platform'
  protected readonly logger = new Logger(PlatformBaseService.name)

  @Inject(OAuth2CredentialRepository)
  protected readonly oauth2CredentialRepository: OAuth2CredentialRepository

  @Inject(AccountRepository)
  protected readonly accountRepository: AccountRepository

  constructor() { }

  abstract getAccessTokenStatus(accountId: string): Promise<number>

  /**
   * 获取链接的作品信�?
   * @param accountType
   * @param workLink
   * @param dataId
   * @param accountId 如果传入需要验�?
   */
  abstract getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, accountId?: string): Promise<WorkLinkInfo>

  protected async syncAccountStatisticsOnAuth(
    accountId: string,
    loadStatistics: () => Promise<AccountAuthStatistics>,
  ) {
    try {
      const statistics = await loadStatistics()
      const entries = Object.entries(statistics).filter(([, value]) => (
        typeof value === 'number' && Number.isFinite(value)
      ))
      if (entries.length === 0) {
        return
      }
      await this.accountRepository.updateAccountStatistics(
        accountId,
        Object.fromEntries(entries) as AccountAuthStatistics,
      )
      await this.accountRepository.updateById(accountId, { lastStatsTime: new Date() })
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to sync account statistics on auth, accountId=${accountId}, error=${message}`)
    }
  }

  async validateOwnedWorkLink(
    _accountType: AccountType,
    _accountId: string,
    _workLink: string,
  ): Promise<ValidatedWorkInfo> {
    throw new AppException(ResponseCode.PlatformNotSupported)
  }

  async deletePost(_accountId: string, _postId: string): Promise<boolean> {
    throw new Error(`${this.platform} delete post is not supported`)
  }

  /**
   * 获取作品详情（用于通过链接提交任务时创建发布记录）
   * @param accountId 账号ID（用于API调用授权�?
   * @param dataId 作品ID
   * @returns 作品详情，包含标题、描述、话题、封面等信息
   */
  async getWorkDetail(accountId: string, dataId: string): Promise<WorkDetailInfo | null> {
    void accountId
    void dataId
    // 默认实现返回 null，各平台可覆盖此方法
    return null
  }

  /**
   * 验证作品是否属于指定账号
   * @param accountId 账号ID
   * @param dataId 作品ID
   * @returns true 如果作品属于该账�?
   * @throws AppException 如果作品不属于该账号
   */
  async verifyWorkOwnership(accountId: string, dataId: string): Promise<boolean> {
    void accountId
    void dataId
    // 默认实现：返�?true（不验证�?
    // 各平台可覆盖此方法实现具体验证逻辑
    return true
  }

  protected async getLocalAccount(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountRepository.getById(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account?.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    return account
  }

  protected async getLocalAccountById(accountId: string) {
    const account = await this.accountRepository.getById(accountId)
    if (account?.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    return account
  }

  protected async ensureLocalAccount(accountId: string) {
    return this.getLocalAccountById(accountId)
  }

  // 更新状�?
  protected async updateAccountStatus(accountId: string, status: number) {
    await this.accountRepository.updateAccountStatus(accountId, status)
  }

  protected async resolveRedirectUrl(
    workLink: string,
    options?: { throwOnFailure?: boolean },
  ): Promise<string> {
    let response: { data?: { destroy?: () => void }, request?: { res?: { responseUrl?: string } }, config?: { url?: string } } | null = null
    try {
      response = await axios.get(workLink, {
        maxRedirects: 5,
        timeout: 10000,
        responseType: 'stream',
        maxContentLength: 100 * 1024,
        maxBodyLength: 100 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      const resolvedUrl = response?.request?.res?.responseUrl || response?.config?.url
      if (!resolvedUrl && options?.throwOnFailure) {
        throw new AppException(ResponseCode.WorkLinkInfoNotFound)
      }
      return resolvedUrl || workLink
    }
    catch (error) {
      if (options?.throwOnFailure) {
        if (error instanceof AppException) {
          throw error
        }
        throw new AppException(ResponseCode.WorkLinkInfoNotFound)
      }
      return workLink
    }
    finally {
      response?.data?.destroy?.()
    }
  }
}
