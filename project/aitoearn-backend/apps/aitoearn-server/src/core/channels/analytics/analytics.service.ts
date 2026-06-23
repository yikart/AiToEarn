import type {
  AnalyticsAccountInput,
  AnalyticsWorkInput,
  ChannelAccountDataSnapshotPayload,
  ChannelAccountMetricsSnapshot,
  ChannelWorkAnalyticsResult,
  ChannelWorkDataSnapshotPayload,
} from '../platforms/platforms.interface'
import { Injectable, Logger } from '@nestjs/common'
import { ChannelAccountDataSnapshotRepository, ChannelWorkDataSnapshotRepository } from '@yikart/channel-db'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { AuthService } from '../auth/auth.service'
import { ChannelPlatformException, PlatformErrorCategory } from '../platforms/platforms.exception'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { RelayAccountException } from '../relay/relay-account.exception'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)

  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly authService: AuthService,
    private readonly accountRepository: AccountRepository,
    private readonly accountSnapshotRepository: ChannelAccountDataSnapshotRepository,
    private readonly workSnapshotRepository: ChannelWorkDataSnapshotRepository,
  ) {}

  async fetchAccountAnalytics(
    userId: string,
    accountId: string,
    params?: { since?: Date, until?: Date },
  ) {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    const platform = account.type
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    const provider = this.registry.getAnalytics(platform)
    if (!provider) {
      return { platform, accountId, snapshots: [], message: 'Analytics not supported' }
    }

    const credential = await this.authService.getValidCredential(accountId, userId)

    const input: AnalyticsAccountInput = {
      accountId,
      platform,
      credential: {
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresAt: credential.expiresAt,
        scope: credential.scope,
        platformUid: account.uid,
        account: account.account,
      },
      since: params?.since,
      until: params?.until,
    }

    let result: Awaited<ReturnType<typeof provider.fetchAccountAnalytics>>
    try {
      result = await provider.fetchAccountAnalytics(input)
    }
    catch (error) {
      if (!(
        platform === AccountType.YouTube
        && error instanceof ChannelPlatformException
        && error.category === PlatformErrorCategory.Auth
      )) {
        await this.authService.markAccountOfflineForCredentialFailure(accountId, error, 'platform_auth_failed')
        throw error
      }

      const refreshedCredential = await this.authService.refreshCredential(accountId, userId)
      try {
        result = await provider.fetchAccountAnalytics({
          ...input,
          credential: {
            ...input.credential,
            accessToken: refreshedCredential.accessToken,
            refreshToken: refreshedCredential.refreshToken,
            expiresAt: refreshedCredential.expiresAt,
            scope: refreshedCredential.scope,
          },
        })
      }
      catch (retryError) {
        await this.authService.markAccountOfflineForCredentialFailure(accountId, retryError, 'platform_auth_failed')
        throw retryError
      }
    }
    const savedSnapshots = await this.saveAccountSnapshots(
      userId,
      platform,
      accountId,
      result.snapshots,
      result.rawResponse,
    )
    const latestSnapshot = savedSnapshots[savedSnapshots.length - 1]

    if (latestSnapshot?.metrics) {
      await this.syncAccountMetrics(accountId, latestSnapshot.metrics, latestSnapshot.fetchedAt)
    }

    return {
      platform,
      accountId,
      profile: latestSnapshot?.profile ?? result.profile,
      metrics: latestSnapshot?.metrics ?? result.metrics,
      snapshots: savedSnapshots,
      extra: latestSnapshot?.extra ?? result.extra,
      snapshotId: latestSnapshot?.id,
      fetchedAt: latestSnapshot?.fetchedAt,
    }
  }

  async fetchWorkAnalytics(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    accountId?: string,
    params?: { since?: Date, until?: Date },
  ) {
    if (!accountId) {
      return { platform, accountId, platformWorkId, snapshots: [], message: 'Account required' }
    }

    const account = await this.getPlatformAccount(userId, accountId, platform)
    const provider = this.registry.getAnalytics(platform)
    let platformResult: ChannelWorkAnalyticsResult | undefined
    let platformError: unknown

    if (provider?.fetchWorkAnalytics) {
      try {
        const credential = await this.getCredentialContext(accountId, userId, account)
        const input: AnalyticsWorkInput = {
          accountId,
          platformWorkId,
          platform,
          credential,
          since: params?.since,
          until: params?.until,
        }
        platformResult = await this.callPlatformProvider(accountId, () => provider.fetchWorkAnalytics!(input))
        if (this.hasWorkAnalyticsData(platformResult)) {
          return this.toWorkAnalyticsResponse(
            userId,
            platform,
            platformWorkId,
            accountId,
            platformResult,
          )
        }
      }
      catch (error) {
        platformError = error
        this.logger.error(
          error,
          `Fetch channel work analytics from platform failed: platform=${platform}, accountId=${accountId}, platformWorkId=${platformWorkId}`,
        )
      }
    }

    if (platformError) {
      throw platformError
    }
    if (platformResult) {
      return this.toWorkAnalyticsResponse(userId, platform, platformWorkId, accountId, platformResult)
    }

    return { platform, accountId, platformWorkId, snapshots: [], message: 'Work analytics not supported' }
  }

  private async toWorkAnalyticsResponse(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    accountId: string | undefined,
    result: ChannelWorkAnalyticsResult,
  ) {
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
      accountId,
      platformWorkId,
      work: latestSnapshot?.work ?? result.work,
      metrics: latestSnapshot?.metrics ?? result.metrics,
      snapshots: savedSnapshots,
      extra: latestSnapshot?.extra ?? result.extra,
      snapshotId: latestSnapshot?.id,
      fetchedAt: latestSnapshot?.fetchedAt,
    }
  }

  private hasWorkAnalyticsData(result: ChannelWorkAnalyticsResult) {
    return result.snapshots.length > 0 || Boolean(result.metrics)
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

  private async getCredentialContext(
    accountId: string,
    userId: string,
    account: { uid?: string, account?: string },
  ) {
    const credential = await this.authService.getValidCredential(accountId, userId)
    return {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      expiresAt: credential.expiresAt,
      scope: credential.scope,
      platformUid: account.uid,
      account: account.account,
    }
  }

  private async callPlatformProvider<T>(accountId: string, action: () => Promise<T>): Promise<T> {
    try {
      return await action()
    }
    catch (error) {
      await this.authService.markAccountOfflineForCredentialFailure(accountId, error, 'platform_auth_failed')
      throw error
    }
  }

  private async saveAccountSnapshots(
    userId: string,
    platform: AccountType,
    accountId: string,
    snapshots: ChannelAccountDataSnapshotPayload[],
    rawResponse?: unknown,
  ) {
    if (snapshots.length === 0) {
      return []
    }
    return this.accountSnapshotRepository.createMany(
      snapshots.map(snapshot => ({
        userId,
        platform,
        accountId,
        platformUid: snapshot.platformUid,
        snapshotAt: snapshot.snapshotAt,
        fetchedAt: snapshot.fetchedAt ?? new Date(),
        periodStartAt: snapshot.periodStartAt,
        periodEndAt: snapshot.periodEndAt,
        profile: snapshot.profile,
        metrics: snapshot.metrics,
        extra: snapshot.extra,
        rawResponse: snapshot.rawResponse ?? rawResponse,
      })),
    )
  }

  private async saveWorkSnapshots(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    accountId: string | undefined,
    snapshots: ChannelWorkDataSnapshotPayload[],
    rawResponse?: unknown,
  ) {
    if (snapshots.length === 0) {
      return []
    }
    return this.workSnapshotRepository.createMany(
      snapshots.map(snapshot => ({
        userId,
        platform,
        accountId,
        platformWorkId: snapshot.platformWorkId ?? platformWorkId,
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

  private async syncAccountMetrics(accountId: string, metrics: ChannelAccountMetricsSnapshot, fetchedAt: Date) {
    const update: {
      fansCount?: number
      followingCount?: number
      workCount?: number
      readCount?: number
      likeCount?: number
      collectCount?: number
      forwardCount?: number
      commentCount?: number
      lastStatsTime: Date
    } = {
      lastStatsTime: fetchedAt,
    }
    if (metrics.fansCount !== undefined) {
      update.fansCount = metrics.fansCount
    }
    if (metrics.followingCount !== undefined) {
      update.followingCount = metrics.followingCount
    }
    if (metrics.workCount !== undefined) {
      update.workCount = metrics.workCount
    }
    if (metrics.readCount !== undefined) {
      update.readCount = metrics.readCount
    }
    if (metrics.likeCount !== undefined) {
      update.likeCount = metrics.likeCount
    }
    if (metrics.collectCount !== undefined) {
      update.collectCount = metrics.collectCount
    }
    if (metrics.forwardCount !== undefined) {
      update.forwardCount = metrics.forwardCount
    }
    if (metrics.commentCount !== undefined) {
      update.commentCount = metrics.commentCount
    }
    await this.accountRepository.updateById(accountId, update)
  }
}
