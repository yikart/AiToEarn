import { Inject, Injectable, Logger } from '@nestjs/common'
import { PublishType } from '@yikart/aitoearn-server-client'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { ChannelRedisKeys } from '../../channel.constants'
import { PlatformBaseService } from '../base.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { META_TIME_CONSTANTS } from './constants'
import { MetaUserOAuthCredential } from './meta.interfaces'

@Injectable()
export class MetaBaseService extends PlatformBaseService {
  protected override readonly platform: AccountType | 'meta' = 'meta'
  protected override readonly logger = new Logger(MetaBaseService.name)

  @Inject(RedisService)
  protected readonly redisService: RedisService

  constructor() {
    super()
  }

  protected async getOAuth2Credential(accountId: string): Promise<MetaUserOAuthCredential | null> {
    let key = ChannelRedisKeys.accessToken(this.platform, accountId)
    if (this.platform === AccountType.FACEBOOK) {
      key = ChannelRedisKeys.pageAccessToken(AccountType.FACEBOOK, accountId)
    }
    let credential = await this.redisService.getJson<MetaUserOAuthCredential>(key)
    if (!credential) {
      this.logger.error(`No access token found for accountId: ${this.platform} ${accountId} in redis`)
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        this.platform,
      )
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential = JSON.parse(oauth2Credential.raw || '') as MetaUserOAuthCredential
    }
    return credential
  }

  protected async saveOAuth2Credential(
    accountId: string,
    tokenInfo: MetaUserOAuthCredential,
    platform: AccountType | 'meta',
  ): Promise<boolean> {
    const now = getCurrentTimestamp()
    const expireTime
      = now + tokenInfo.expires_in - META_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    tokenInfo.expires_in = expireTime
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken(platform, accountId),
      tokenInfo,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      platform,
      {
        accessToken: tokenInfo.access_token,
        refreshToken: tokenInfo.refresh_token,
        accessTokenExpiresAt: tokenInfo.expires_in,
        refreshTokenExpiresAt: tokenInfo.refresh_token_expires_in
          ? Number(tokenInfo.refresh_token_expires_in)
          : undefined,
        raw: JSON.stringify(tokenInfo),
      },
    )
    const saved = cached && persistResult
    return saved
  }

  override async getAccessTokenStatus(
    accountId: string,
  ): Promise<number> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    const status = credential.expires_in > getCurrentTimestamp() ? 1 : 0
    this.updateAccountStatus(accountId, status)
    return status
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const postId = this.parseMetaUrl(workLink)
    if (!postId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: postId,
      uniqueId: `${accountType}_${postId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析 Meta 系平台 URL，提取帖子 ID
   * 子类可以覆盖此方法以提供特定平台的解析逻辑
   * @param workLink 链接
   * @returns postId 或 null
   */
  protected parseMetaUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return null
    }

    // 通用 Meta 链接解析，子类可以覆盖
    const pathname = url.pathname
    const idMatch = pathname.match(/\/(\d+)\/?$/)
    if (idMatch) {
      return idMatch[1]
    }

    return null
  }
}
