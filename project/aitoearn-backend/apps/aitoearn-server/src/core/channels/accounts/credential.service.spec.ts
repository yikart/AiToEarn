import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CredentialService } from './credential.service'

vi.mock('@yikart/mongodb', () => ({
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
  Transactional: () => () => undefined,
}))

vi.mock('../platforms/platforms.registry', () => ({
  PlatformIntegrationRegistry: class PlatformIntegrationRegistry {},
}))

function createService(overrides: {
  credentialRepo?: unknown
  redis?: unknown
  registry?: unknown
  refresh?: unknown
} = {}) {
  const credentialRepo = overrides.credentialRepo as {
    getByAccountId: ReturnType<typeof vi.fn>
    createOrUpdateByAccountId: ReturnType<typeof vi.fn>
    deleteByAccountId: ReturnType<typeof vi.fn>
    listByAccessTokenExpiresAt: ReturnType<typeof vi.fn>
    listByAccessTokenExpiresAtAndNormalAccount: ReturnType<typeof vi.fn>
  } ?? {
    getByAccountId: vi.fn(),
    createOrUpdateByAccountId: vi.fn(async (
      accountId: string,
      platform: AccountType,
      data: Record<string, unknown>,
    ) => ({ id: 'credential-1', accountId, platform, ...data })),
    deleteByAccountId: vi.fn(async () => true),
    listByAccessTokenExpiresAt: vi.fn(),
    listByAccessTokenExpiresAtAndNormalAccount: vi.fn(),
  }
  const redis = overrides.redis as {
    getChannelCredentialCache: ReturnType<typeof vi.fn>
    saveChannelCredentialCache: ReturnType<typeof vi.fn>
    deleteChannelCredentialCache: ReturnType<typeof vi.fn>
    acquireChannelCredentialRefreshLock: ReturnType<typeof vi.fn>
    releaseChannelCredentialRefreshLock: ReturnType<typeof vi.fn>
  } ?? {
    getChannelCredentialCache: vi.fn(),
    saveChannelCredentialCache: vi.fn(),
    deleteChannelCredentialCache: vi.fn(),
    acquireChannelCredentialRefreshLock: vi.fn(),
    releaseChannelCredentialRefreshLock: vi.fn(),
  }
  const refresh = overrides.refresh as ReturnType<typeof vi.fn> ?? vi.fn(async () => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    scope: 'video.list',
    raw: { token: 'raw-token' },
  }))
  const registry = overrides.registry as { getAuth: ReturnType<typeof vi.fn> } ?? {
    getAuth: vi.fn(() => ({ refresh })),
  }

  return {
    service: new CredentialService(credentialRepo as never, redis as never, registry as never),
    credentialRepo,
    redis,
    registry,
    refresh,
  }
}

describe('credential service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves stored refresh token when provider omits it', async () => {
    const { service, credentialRepo, redis } = createService()
    await service.saveCredential('account-1', AccountType.Facebook, {
      accessToken: 'page-access-token',
      refreshToken: undefined,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(credentialRepo.createOrUpdateByAccountId).toHaveBeenCalledWith('account-1', AccountType.Facebook, {
      accessToken: 'page-access-token',
      accessTokenExpiresAt: 1767225600,
      refreshToken: undefined,
      scope: undefined,
      raw: undefined,
    })
    expect(redis.deleteChannelCredentialCache).toHaveBeenCalledWith('account-1')
  })

  it('saves refresh token when provider returns it', async () => {
    const { service, credentialRepo } = createService()

    await service.saveCredential('account-1', AccountType.Facebook, {
      accessToken: 'page-access-token',
      refreshToken: 'page-refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(credentialRepo.createOrUpdateByAccountId).toHaveBeenCalledWith('account-1', AccountType.Facebook, {
      accessToken: 'page-access-token',
      refreshToken: 'page-refresh-token',
      accessTokenExpiresAt: 1767225600,
      scope: undefined,
      raw: undefined,
    })
  })

  it('clears stored access token expiry when provider omits expiresAt', async () => {
    const { service, credentialRepo } = createService()

    await service.saveCredential('account-1', AccountType.Facebook, {
      accessToken: 'long-lived-access-token',
    })

    expect(credentialRepo.createOrUpdateByAccountId).toHaveBeenCalledWith('account-1', AccountType.Facebook, {
      accessToken: 'long-lived-access-token',
      accessTokenExpiresAt: undefined,
      refreshToken: undefined,
      scope: undefined,
      raw: undefined,
    })
  })

  it('keeps credential scope in storage and cache reads', async () => {
    const { service, credentialRepo, redis } = createService()
    redis.getChannelCredentialCache.mockResolvedValue(null)
    credentialRepo.getByAccountId.mockResolvedValue({
      accountId: 'account-1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: 1767225600,
      scope: 'video.publish',
      raw: { provider: 'facebook' },
    })

    await expect(service.getCredential('account-1')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 1767225600,
      scope: 'video.publish',
      raw: { provider: 'facebook' },
    })
    expect(redis.saveChannelCredentialCache).toHaveBeenCalledWith('account-1', expect.objectContaining({
      scope: 'video.publish',
    }))
  })

  it('saves credential scope when provider returns it', async () => {
    const { service, credentialRepo } = createService()

    await service.saveCredential('account-1', AccountType.Facebook, {
      accessToken: 'page-access-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scope: 'pages_manage_posts',
    })

    expect(credentialRepo.createOrUpdateByAccountId).toHaveBeenCalledWith('account-1', AccountType.Facebook, expect.objectContaining({
      scope: 'pages_manage_posts',
    }))
  })

  it('lists expiring credentials with a caller supplied limit', async () => {
    const { service, credentialRepo } = createService()
    credentialRepo.listByAccessTokenExpiresAtAndNormalAccount.mockResolvedValue([{
      cursorId: 'cursor-id',
      accountId: 'account-1',
      platform: AccountType.Facebook,
      accessTokenExpiresAt: 1767225600,
    }])

    await expect(service.listExpiringCredentials(1767225600, 100)).resolves.toEqual([{
      cursorId: 'cursor-id',
      accountId: 'account-1',
      platform: AccountType.Facebook,
      accessTokenExpiresAt: 1767225600,
      refreshTokenExpiresAt: undefined,
    }])
    expect(credentialRepo.listByAccessTokenExpiresAtAndNormalAccount).toHaveBeenCalledWith(1767225600, 100, undefined)
  })

  it('deletes credential records and cache entries together', async () => {
    const { service, credentialRepo, redis } = createService()

    await service.deleteCredential('account-1')

    expect(credentialRepo.deleteByAccountId).toHaveBeenCalledWith('account-1')
    expect(redis.deleteChannelCredentialCache).toHaveBeenCalledWith('account-1')
  })

  it('uses an owner token for credential refresh locks', async () => {
    const { service, redis } = createService()
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)

    const token = await service.lockRefresh('account-1')

    expect(token).toEqual(expect.any(String))
    expect(redis.acquireChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', token)

    await service.unlockRefresh('account-1', token!)

    expect(redis.releaseChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', token)
  })

  it('returns null when another refresh owns the lock', async () => {
    const { service, redis, credentialRepo, registry } = createService()
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(false)

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.TikTok,
    })).resolves.toBeNull()

    expect(credentialRepo.getByAccountId).not.toHaveBeenCalled()
    expect(credentialRepo.createOrUpdateByAccountId).not.toHaveBeenCalled()
    expect(redis.releaseChannelCredentialRefreshLock).not.toHaveBeenCalled()
    expect(registry.getAuth).not.toHaveBeenCalled()
  })

  it('refreshes, saves, and returns the refreshed credential metadata', async () => {
    const { service, credentialRepo, redis, refresh } = createService()
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)
    redis.getChannelCredentialCache.mockResolvedValue(null)
    credentialRepo.getByAccountId.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      scope: 'user.info',
    })

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.TikTok,
    })).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scope: 'video.list',
    })

    expect(refresh).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    expect(credentialRepo.createOrUpdateByAccountId).toHaveBeenCalledWith('account-1', AccountType.TikTok, {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      accessTokenExpiresAt: 1767225600,
      scope: 'video.list',
      raw: { token: 'raw-token' },
    })
    expect(redis.releaseChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', expect.any(String))
  })

  it('keeps the existing refresh token and scope when the provider omits them', async () => {
    const { service, credentialRepo, redis } = createService({
      refresh: vi.fn(async () => ({
        accessToken: 'new-access-token',
      })),
    })
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)
    redis.getChannelCredentialCache.mockResolvedValue(null)
    credentialRepo.getByAccountId.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      scope: 'user.info',
    })

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.TikTok,
    })).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'refresh-token',
      scope: 'user.info',
    })
  })

  it('releases the refresh lock when credential is missing', async () => {
    const { service, redis } = createService()
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)
    redis.getChannelCredentialCache.mockResolvedValue(null)

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.YouTube,
    }))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelCredentialNotFound,
      })

    expect(redis.releaseChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', expect.any(String))
  })

  it('rejects refresh when provider returns no access token', async () => {
    const { service, credentialRepo, redis } = createService({
      refresh: vi.fn(async () => ({
        refreshToken: 'new-refresh-token',
      })),
    })
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)
    redis.getChannelCredentialCache.mockResolvedValue(null)
    credentialRepo.getByAccountId.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.YouTube,
    }))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelAccessTokenFailed,
      })

    expect(credentialRepo.createOrUpdateByAccountId).not.toHaveBeenCalled()
    expect(redis.releaseChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', expect.any(String))
  })

  it('releases the refresh lock when provider refresh fails', async () => {
    const { service, credentialRepo, redis } = createService({
      refresh: vi.fn(async () => {
        throw new AppException(ResponseCode.ChannelRefreshTokenFailed)
      }),
    })
    redis.acquireChannelCredentialRefreshLock.mockResolvedValue(true)
    redis.getChannelCredentialCache.mockResolvedValue(null)
    credentialRepo.getByAccountId.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    await expect(service.tryRefresh({
      id: 'account-1',
      type: AccountType.YouTube,
    }))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelRefreshTokenFailed,
      })

    expect(redis.releaseChannelCredentialRefreshLock).toHaveBeenCalledWith('account-1', expect.any(String))
  })
})
