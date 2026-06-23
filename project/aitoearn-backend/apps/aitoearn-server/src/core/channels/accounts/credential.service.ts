import type { AccountType } from '@yikart/common'
import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { OAuth2CredentialRepository, Transactional } from '@yikart/mongodb'
import { ServerRedisService } from '../../../common/redis'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'

interface CachedCredential {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  scope?: string
  raw?: unknown
}

export interface RefreshedCredential {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export interface ExpiringCredentialCursor {
  accessTokenExpiresAt: number
  cursorId: unknown
}

export interface ExpiringCredential extends ExpiringCredentialCursor {
  accountId: string
  platform: AccountType
  refreshTokenExpiresAt?: number
}

@Injectable()
export class CredentialService {
  constructor(
    private readonly credentialRepo: OAuth2CredentialRepository,
    private readonly redis: ServerRedisService,
    private readonly registry: PlatformIntegrationRegistry,
  ) {}

  async getCredential(accountId: string): Promise<CachedCredential | null> {
    const cached = await this.redis.getChannelCredentialCache<CachedCredential>(accountId)
    if (cached) {
      return cached
    }

    const record = await this.credentialRepo.getByAccountId(accountId)
    if (!record) {
      return null
    }

    const credential: CachedCredential = {
      accessToken: record.accessToken,
      refreshToken: record.refreshToken || undefined,
      expiresAt: record.accessTokenExpiresAt,
      scope: record.scope || undefined,
      raw: record.raw,
    }

    await this.redis.saveChannelCredentialCache(accountId, credential)
    return credential
  }

  @Transactional()
  async saveCredential(
    accountId: string,
    platform: AccountType,
    credential: {
      accessToken: string
      refreshToken?: string
      expiresAt?: Date
      scope?: string
      raw?: unknown
    },
  ): Promise<void> {
    const accessTokenExpiresAt = credential.expiresAt
      ? Math.floor(credential.expiresAt.getTime() / 1000)
      : undefined
    const credentialData = {
      accessToken: credential.accessToken,
      accessTokenExpiresAt,
      ...(credential.refreshToken !== undefined && { refreshToken: credential.refreshToken }),
      ...(credential.scope !== undefined && { scope: credential.scope }),
      ...(credential.raw !== undefined && { raw: credential.raw }),
    }

    await this.credentialRepo.createOrUpdateByAccountId(accountId, platform, credentialData)

    await this.redis.deleteChannelCredentialCache(accountId)
  }

  @Transactional()
  async deleteCredential(accountId: string): Promise<void> {
    await this.deleteCredentialRecord(accountId)
    await this.redis.deleteChannelCredentialCache(accountId)
  }

  async deleteCredentialRecord(accountId: string): Promise<void> {
    await this.credentialRepo.deleteByAccountId(accountId)
  }

  async invalidateCredential(accountId: string): Promise<void> {
    await this.redis.deleteChannelCredentialCache(accountId)
  }

  async lockRefresh(accountId: string): Promise<string | null> {
    const token = randomUUID()
    const locked = await this.redis.acquireChannelCredentialRefreshLock(accountId, token)
    return locked ? token : null
  }

  async unlockRefresh(accountId: string, token: string): Promise<void> {
    await this.redis.releaseChannelCredentialRefreshLock(accountId, token)
  }

  async tryRefresh(account: { id: string, type: AccountType }): Promise<RefreshedCredential | null> {
    const lockToken = await this.lockRefresh(account.id)
    if (!lockToken) {
      return null
    }

    try {
      const credential = await this.getCredential(account.id)
      if (!credential) {
        throw new AppException(ResponseCode.ChannelCredentialNotFound, { accountId: account.id })
      }

      const result = await this.registry.getAuth(account.type).refresh({
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
      })
      if (!result.accessToken) {
        throw new AppException(ResponseCode.ChannelAccessTokenFailed)
      }
      const refreshToken = result.refreshToken ?? credential.refreshToken

      await this.saveCredential(account.id, account.type, {
        accessToken: result.accessToken,
        refreshToken,
        expiresAt: result.expiresAt,
        scope: result.scope,
        raw: result.raw,
      })

      return {
        accessToken: result.accessToken,
        refreshToken,
        expiresAt: result.expiresAt,
        scope: result.scope ?? credential.scope,
      }
    }
    finally {
      await this.unlockRefresh(account.id, lockToken)
    }
  }

  async listExpiringCredentials(
    beforeTimestamp: number,
    limit: number,
    cursor?: ExpiringCredentialCursor,
  ): Promise<ExpiringCredential[]> {
    const records = await this.credentialRepo.listByAccessTokenExpiresAtAndNormalAccount(beforeTimestamp, limit, cursor)
    return records.map(r => ({
      cursorId: r.cursorId,
      accountId: r.accountId,
      platform: r.platform,
      accessTokenExpiresAt: r.accessTokenExpiresAt as number,
      refreshTokenExpiresAt: r.refreshTokenExpiresAt,
    }))
  }
}
