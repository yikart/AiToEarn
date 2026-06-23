import type { AccountType } from '@yikart/common'
import type {
  ChannelPaginationInput,
  ChannelWorkDataSnapshotPayload,
  WorkDetailInput,
  WorkLinkInfoInput,
  WorkListInput,
  WorkOwnershipInput,
} from '../platforms/platforms.interface'
import { Injectable } from '@nestjs/common'
import { ChannelWorkDataSnapshotRepository } from '@yikart/channel-db'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { AuthService } from '../auth/auth.service'
import { normalizeChannelPagination } from '../platforms/platform-pagination.helper'
import { AuthType, ChannelPaginationMode } from '../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { RelayAccountException } from '../relay/relay-account.exception'

@Injectable()
export class WorkService {
  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly authService: AuthService,
    private readonly accountRepository: AccountRepository,
    private readonly workSnapshotRepository: ChannelWorkDataSnapshotRepository,
  ) {}

  async getLinkInfo(
    userId: string,
    platform: AccountType,
    link: string,
    accountId?: string,
    dataId?: string,
  ) {
    return this.resolveLinkInfo(userId, platform, link, accountId, dataId)
  }

  async parseLinkInfo(platform: AccountType, link: string) {
    return this.resolveLinkInfo(undefined, platform, link)
  }

  async listWorks(
    userId: string,
    platform: AccountType,
    accountId: string,
    pagination: ChannelPaginationInput,
  ) {
    const provider = this.registry.getWork(platform)
    if (!provider?.listWorks) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform,
        capability: 'work.listWorks',
      })
    }

    const normalizedPagination = normalizeChannelPagination(
      platform,
      provider.listWorksPagination ?? { mode: ChannelPaginationMode.None },
      pagination,
    )
    const credential = await this.getPlatformCredential(userId, accountId, platform)

    const input: WorkListInput = {
      accountId,
      platform,
      credential,
      pagination: normalizedPagination,
    }
    const result = await this.callPlatformProvider(accountId, () => provider.listWorks!(input))
    return {
      platform,
      items: result.items,
      pagination: result.pagination,
    }
  }

  private async resolveLinkInfo(
    userId: string | undefined,
    platform: AccountType,
    link: string,
    accountId?: string,
    dataId?: string,
  ) {
    const integration = this.registry.get(platform)
    const provider = integration.work
    if (!provider?.getLinkInfo) {
      return { platform, snapshots: [], message: 'Link info not supported' }
    }

    const needsAccountContext = provider.requiresCredentialForLinkInfo !== false
    if (!accountId && needsAccountContext) {
      return { platform, snapshots: [], message: 'Account required' }
    }

    const shouldLoadCredential = Boolean(
      accountId
      && integration.metadata.authType !== AuthType.Plugin,
    )

    const credential = shouldLoadCredential && accountId
      ? await this.getPlatformCredential(userId ?? '', accountId, platform)
      : undefined
    if (accountId && !credential) {
      await this.getPlatformAccount(userId ?? '', accountId, platform)
    }

    const input: WorkLinkInfoInput = {
      accountId,
      platform,
      credential: credential || undefined,
      link,
      ...(dataId ? { dataId } : {}),
    }

    const result = await this.callPlatformProvider(accountId, () => provider.getLinkInfo!(input))
    const savedSnapshots = await this.saveWorkSnapshots(
      userId,
      platform,
      result.work?.id,
      accountId,
      result.snapshots,
      result.rawResponse,
    )
    const latestSnapshot = savedSnapshots[savedSnapshots.length - 1]

    return {
      platform,
      work: latestSnapshot?.work ?? result.work,
      snapshots: savedSnapshots,
      extra: latestSnapshot?.extra ?? result.extra,
      snapshotId: latestSnapshot?.id,
      fetchedAt: latestSnapshot?.fetchedAt,
    }
  }

  async getDetail(
    userId: string | undefined,
    platform: AccountType,
    platformWorkId: string,
    accountId?: string,
  ) {
    const provider = this.registry.getWork(platform)
    if (!provider?.getDetail) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform,
        capability: 'work.getDetail',
      })
    }

    if (!accountId) {
      throw new AppException(ResponseCode.AccountAuthRequired, { platform })
    }

    const credential = await this.getPlatformCredential(userId ?? '', accountId, platform)

    const input: WorkDetailInput = {
      accountId,
      platformWorkId,
      platform,
      credential,
    }

    const result = await this.callPlatformProvider(accountId, () => provider.getDetail!(input))
    const savedSnapshots = await this.saveWorkSnapshots(
      userId,
      platform,
      platformWorkId,
      accountId,
      result.snapshots,
      result.rawResponse,
    )
    const latestSnapshot = savedSnapshots[savedSnapshots.length - 1]

    return {
      platform,
      work: latestSnapshot?.work ?? result.work,
      snapshots: savedSnapshots,
      extra: latestSnapshot?.extra ?? result.extra,
      snapshotId: latestSnapshot?.id,
      fetchedAt: latestSnapshot?.fetchedAt,
    }
  }

  async verifyOwnership(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    candidateAccountId: string,
  ) {
    const provider = this.registry.getWork(platform)
    if (!provider?.verifyOwnership) {
      return { platform, owned: false, message: 'Ownership verification not supported' }
    }

    const credential = await this.getPlatformCredential(userId, candidateAccountId, platform)

    const input: WorkOwnershipInput = {
      accountId: candidateAccountId,
      platformWorkId,
      platform,
      credential,
    }

    const owned = await this.callPlatformProvider(candidateAccountId, () => provider.verifyOwnership!(input))
    return { platform, owned }
  }

  private async getPlatformCredential(userId: string, accountId: string, platform: AccountType) {
    const account = await this.getPlatformAccount(userId, accountId, platform)
    const credential = await this.authService.getValidCredential(accountId, userId)
    return {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      platformUid: account.uid,
      account: account.account,
    }
  }

  private async getPlatformAccount(userId: string, accountId: string, platform: AccountType) {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.type !== platform) {
      throw new AppException(ResponseCode.ChannelAuthPlatformMismatch)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    return account
  }

  private async callPlatformProvider<T>(accountId: string | undefined, action: () => Promise<T>): Promise<T> {
    try {
      return await action()
    }
    catch (error) {
      if (accountId) {
        await this.authService.markAccountOfflineForCredentialFailure(accountId, error, 'platform_auth_failed')
      }
      throw error
    }
  }

  private async saveWorkSnapshots(
    userId: string | undefined,
    platform: AccountType,
    fallbackPlatformWorkId: string | undefined,
    accountId: string | undefined,
    snapshots: ChannelWorkDataSnapshotPayload[],
    rawResponse?: unknown,
  ) {
    if (snapshots.length === 0) {
      return []
    }
    if (!userId) {
      return []
    }
    return this.workSnapshotRepository.createMany(
      snapshots.map(snapshot => ({
        userId,
        platform,
        accountId,
        platformWorkId: snapshot.platformWorkId ?? fallbackPlatformWorkId ?? snapshot.work.id,
        snapshotAt: snapshot.snapshotAt,
        fetchedAt: snapshot.fetchedAt ?? new Date(),
        periodStartAt: snapshot.periodStartAt,
        periodEndAt: snapshot.periodEndAt,
        work: snapshot.work,
        metrics: snapshot.metrics,
        extra: snapshot.extra,
        rawResponse: snapshot.rawResponse ?? rawResponse,
      })),
    )
  }
}
