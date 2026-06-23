import { AccountType, ResponseCode } from '@yikart/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms/platforms.exception'
import { AnalyticsService } from './analytics.service'

vi.mock('@yikart/assets', async () => {
  const { z } = await import('zod')
  return {
    assetsConfigSchema: z.object({}).passthrough(),
    VideoMetadataService: class VideoMetadataService {},
  }
})

vi.mock('@yikart/channel-db', async () => {
  const { z } = await import('zod')
  return {
    ChannelAccountDataSnapshotRepository: class ChannelAccountDataSnapshotRepository {},
    ChannelWorkDataSnapshotRepository: class ChannelWorkDataSnapshotRepository {},
    mongodbConfigSchema: z.object({}).passthrough(),
  }
})

vi.mock('@yikart/mongodb', async () => {
  const { z } = await import('zod')
  return {
    AccountRepository: class AccountRepository {},
    AssetType: {
      AiImage: 'aiImage',
      AiVideo: 'aiVideo',
      AiCard: 'aiCard',
      AiChatImage: 'aiChatImage',
      AideoOutput: 'aideoOutput',
      VideoEdit: 'videoEdit',
      DramaRecap: 'dramaRecap',
      StyleTransfer: 'styleTransfer',
      ImageEdit: 'imageEdit',
      Subtitle: 'subtitle',
      UserMedia: 'userMedia',
      UserFile: 'userFile',
      PublishMedia: 'publishMedia',
      Avatar: 'avatar',
      AgentSession: 'agentSession',
      VideoThumbnail: 'videoThumbnail',
      GooglePlace: 'googlePlace',
      Temp: 'temp',
    },
    mongodbConfigSchema: z.object({}).passthrough(),
    PublishRecordRepository: class PublishRecordRepository {},
  }
})

vi.mock('../relay/relay-account.exception', () => ({
  RelayAccountException: class RelayAccountException extends Error {},
}))

vi.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

function createService() {
  const registry = {
    getAnalytics: vi.fn(),
  }
  const authService = {
    getValidCredential: vi.fn(),
    refreshCredential: vi.fn(),
    markAccountOfflineForCredentialFailure: vi.fn(async () => true),
  }
  const accountRepository = {
    getByIdAndUserId: vi.fn(),
    updateById: vi.fn(),
  }
  const accountSnapshotRepository = {
    createMany: vi.fn(),
  }
  const workSnapshotRepository = {
    createMany: vi.fn(async data => data.map((item: Record<string, unknown>, index: number) => ({
      ...item,
      id: `snapshot-${index}`,
    }))),
  }
  const service = new AnalyticsService(
    registry as never,
    authService as never,
    accountRepository as never,
    accountSnapshotRepository as never,
    workSnapshotRepository as never,
  )
  const logger = { error: vi.fn() }
  Object.assign(service as unknown as { logger: typeof logger }, { logger })

  return {
    service,
    registry,
    authService,
    accountRepository,
    workSnapshotRepository,
    logger,
  }
}

describe('analytics service account analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes YouTube credentials and retries account analytics before marking the account offline', async () => {
    const { service, registry, authService, accountRepository } = createService()
    const platformError = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.YouTube,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
      },
    })
    const fetchAccountAnalytics = vi.fn()
    const provider = { fetchAccountAnalytics }
    let callCount = 0
    fetchAccountAnalytics.mockImplementation(function (this: unknown) {
      expect(this).toBe(provider)
      callCount += 1
      if (callCount === 1) {
        return Promise.reject(platformError)
      }
      return Promise.resolve({
        snapshots: [],
        metrics: { fansCount: 10 },
      })
    })
    registry.getAnalytics.mockReturnValue(provider)
    accountRepository.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.YouTube,
      uid: 'channel-1',
    })
    authService.getValidCredential.mockResolvedValue({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      scope: 'old-scope',
    })
    authService.refreshCredential.mockResolvedValue({
      accessToken: 'refreshed-token',
      refreshToken: 'refreshed-refresh-token',
      expiresAt: new Date('2026-07-01T00:00:00.000Z'),
      scope: 'new-scope',
    })

    const result = await service.fetchAccountAnalytics('user-1', 'account-1')

    expect(authService.refreshCredential).toHaveBeenCalledWith('account-1', 'user-1')
    expect(fetchAccountAnalytics).toHaveBeenCalledTimes(2)
    expect(fetchAccountAnalytics).toHaveBeenNthCalledWith(1, expect.objectContaining({
      credential: expect.objectContaining({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        scope: 'old-scope',
      }),
    }))
    expect(fetchAccountAnalytics).toHaveBeenNthCalledWith(2, expect.objectContaining({
      credential: expect.objectContaining({
        accessToken: 'refreshed-token',
        refreshToken: 'refreshed-refresh-token',
        scope: 'new-scope',
      }),
    }))
    expect(authService.markAccountOfflineForCredentialFailure).not.toHaveBeenCalled()
    expect(result.metrics).toEqual({ fansCount: 10 })
  })
})

describe('analytics service work analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses official work analytics when it returns metrics', async () => {
    const { service, registry, authService, accountRepository } = createService()
    const fetchedAt = new Date('2026-06-01T00:00:00.000Z')
    const fetchWorkAnalytics = vi.fn()
    const provider = { fetchWorkAnalytics }
    fetchWorkAnalytics.mockImplementation(function (this: unknown) {
      expect(this).toBe(provider)
      return Promise.resolve({
        snapshots: [{
          platformWorkId: 'video-1',
          snapshotAt: fetchedAt,
          fetchedAt,
          work: { id: 'video-1' },
          metrics: { viewCount: 10 },
        }],
        metrics: { viewCount: 10 },
      })
    })
    registry.getAnalytics.mockReturnValue(provider)
    accountRepository.getByIdAndUserId.mockResolvedValue({ id: 'account-1', type: AccountType.YouTube, uid: 'uid-1' })
    authService.getValidCredential.mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    const result = await service.fetchWorkAnalytics('user-1', AccountType.YouTube, 'video-1', 'account-1')

    expect(fetchWorkAnalytics).toHaveBeenCalledWith({
      accountId: 'account-1',
      platformWorkId: 'video-1',
      platform: AccountType.YouTube,
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: undefined,
        scope: undefined,
        platformUid: 'uid-1',
        account: undefined,
      },
      since: undefined,
      until: undefined,
    })
    expect(result.metrics).toEqual({ viewCount: 10 })
  })

  it('rethrows official work analytics failures after logging the platform error', async () => {
    const { service, registry, authService, accountRepository, logger } = createService()
    const platformError = new Error('platform failed')
    registry.getAnalytics.mockReturnValue({
      fetchWorkAnalytics: vi.fn().mockRejectedValue(platformError),
    })
    accountRepository.getByIdAndUserId.mockResolvedValue({ id: 'account-1', type: AccountType.YouTube, uid: 'uid-1' })
    authService.getValidCredential.mockResolvedValue({ accessToken: 'access-token' })

    await expect(service.fetchWorkAnalytics('user-1', AccountType.YouTube, 'video-1', 'account-1'))
      .rejects
      .toBe(platformError)

    expect(logger.error).toHaveBeenCalledWith(
      platformError,
      'Fetch channel work analytics from platform failed: platform=youtube, accountId=account-1, platformWorkId=video-1',
    )
  })

  it('marks the account offline when official work analytics returns an auth failure', async () => {
    const { service, registry, authService, accountRepository } = createService()
    const platformError = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.YouTube,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
      },
    })
    registry.getAnalytics.mockReturnValue({
      fetchWorkAnalytics: vi.fn().mockRejectedValue(platformError),
    })
    accountRepository.getByIdAndUserId.mockResolvedValue({ id: 'account-1', type: AccountType.YouTube, uid: 'uid-1' })
    authService.getValidCredential.mockResolvedValue({ accessToken: 'access-token' })

    await expect(service.fetchWorkAnalytics('user-1', AccountType.YouTube, 'video-1', 'account-1'))
      .rejects
      .toBe(platformError)

    expect(authService.markAccountOfflineForCredentialFailure).toHaveBeenCalledWith(
      'account-1',
      platformError,
      'platform_auth_failed',
    )
  })

  it('returns unsupported when there is no official work analytics provider', async () => {
    const { service, registry, authService, accountRepository } = createService()
    registry.getAnalytics.mockReturnValue(undefined)
    accountRepository.getByIdAndUserId.mockResolvedValue({ id: 'account-1', type: AccountType.RedNote })

    const result = await service.fetchWorkAnalytics('user-1', AccountType.RedNote, 'note-1', 'account-1')

    expect(authService.getValidCredential).not.toHaveBeenCalled()
    expect(result).toEqual({
      platform: AccountType.RedNote,
      accountId: 'account-1',
      platformWorkId: 'note-1',
      snapshots: [],
      message: 'Work analytics not supported',
    })
  })
})
