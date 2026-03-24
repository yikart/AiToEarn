import { Inject, Injectable, Logger } from '@nestjs/common'
import { OAuth2CredentialRepository } from '@yikart/channel-db'
import { AccountType } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
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
  type: string // 作品类型（video/image）
  videoType?: 'short' | 'long' // 视频类型
  duration?: number // 视频时长（秒）
  rawData?: Record<string, unknown> // 原始API返回数据
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
   * 获取链接的作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @param accountId 如果传入需要验证
   */
  abstract getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, accountId?: string): Promise<{
    dataId: string
    uniqueId: string // accountType + 平台方ID
    type: string
    videoType?: 'short' | 'long'
  }>

  async deletePost(_accountId: string, _postId: string): Promise<boolean> {
    throw new Error(`${this.platform} delete post is not supported`)
  }

  /**
   * 获取作品详情（用于通过链接提交任务时创建发布记录）
   * @param accountId 账号ID（用于API调用授权）
   * @param dataId 作品ID
   * @returns 作品详情，包含标题、描述、话题、封面等信息
   */
  async getWorkDetail(_accountId: string, _dataId: string): Promise<WorkDetailInfo | null> {
    // 默认实现返回 null，各平台可覆盖此方法
    return null
  }

  /**
   * 验证作品是否属于指定账号
   * @param accountId 账号ID
   * @param dataId 作品ID
   * @returns true 如果作品属于该账号
   * @throws AppException 如果作品不属于该账号
   */
  async verifyWorkOwnership(_accountId: string, _dataId: string): Promise<boolean> {
    // 默认实现：返回 true（不验证）
    // 各平台可覆盖此方法实现具体验证逻辑
    return true
  }

  protected async ensureLocalAccount(accountId: string) {
    const account = await this.accountRepository.getById(accountId)
    if (account?.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    return account
  }

  // 更新状态
  protected async updateAccountStatus(accountId: string, status: number) {
    await this.accountRepository.updateAccountStatus(accountId, status)
  }
}
