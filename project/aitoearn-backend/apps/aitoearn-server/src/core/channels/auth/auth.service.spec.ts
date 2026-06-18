import type { GenerateAuthUrlInput } from '../platforms/platforms.interface'
import type { AuthSession } from './auth.interface'
import { Logger } from '@nestjs/common'
import { AccountType, AppException, ChannelAuthSessionStatus, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms/platforms.exception'
import { AuthCallbackResponseType } from '../platforms/platforms.interface'
import { ChannelAuthSessionFlow } from './auth.interface'
import { AuthService } from './auth.service'

vi.mock('@yikart/mongodb', async () => {
  const { z } = await import('zod')

  return {
    mongodbConfigSchema: z.any(),
    AssetStatus: {
      Pending: 'pending',
      Uploaded: 'uploaded',
      Confirmed: 'confirmed',
      Failed: 'failed',
    },
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
    AccountStatus: {
      NORMAL: 1,
      ABNORMAL: 0,
    },
    Transactional: () => () => undefined,
    AccountGroupRepository: class AccountGroupRepository {},
    AccountRepository: class AccountRepository {},
    AssetRepository: class AssetRepository {},
    OAuth2CredentialRepository: class OAuth2CredentialRepository {},
  }
})

vi.mock('@yikart/channel-db', async () => {
  const { z } = await import('zod')

  return {
    mongodbConfigSchema: z.any(),
    ChannelAuthIdentityRepository: class ChannelAuthIdentityRepository {},
  }
})

vi.mock('@yikart/redis', async () => {
  const { z } = await import('zod')

  return {
    redisConfigSchema: z.any(),
    RedisService: class RedisService {},
    EventStream: {
      Channels: 'channels',
    },
    EventStreamService: class EventStreamService {},
    EventTopic: {
      ChannelsAccountConnected: 'channels.account.connected',
      ChannelsAccountOffline: 'channels.account.offline',
    },
  }
})

vi.mock('@yikart/aitoearn-auth', async () => {
  const { z } = await import('zod')

  return {
    aitoearnAuthConfigSchema: z.any(),
    GetToken: () => () => undefined,
    Public: () => () => undefined,
    TokenInfo: class TokenInfo {},
  }
})

vi.mock('../../user/user.service', () => ({
  UserService: class UserService {},
}))

vi.mock('../../relay/relay-client.service', () => ({
  RelayClientService: class RelayClientService {},
}))

function createService() {
  const provider = {
    generateAuthUrl: vi.fn(async (input: GenerateAuthUrlInput) => ({
      url: `https://provider.example.test/oauth?state=${input.state}`,
      state: input.state,
      redirectUri: 'https://api.example.test/v2/channels/accounts/auth/twitter/callback',
    })),
    exchangeCode: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
    refresh: vi.fn(),
    revoke: vi.fn(async () => undefined),
    getProfile: vi.fn(async () => ({
      platformUid: 'platform-user',
      displayName: 'Platform User',
    })),
    listSelectableAccounts: undefined as undefined | ((input: { accessToken: string, refreshToken?: string }) => Promise<unknown[]>),
  }
  const registry = {
    has: vi.fn(() => true),
    getAuth: vi.fn(() => provider),
    get: vi.fn((platform: AccountType) => ({
      auth: provider,
      metadata: {
        displayName: platform === AccountType.Facebook
          ? {
              'en-US': 'Facebook',
              'zh-CN': 'Facebook',
            }
          : {
              'en-US': 'Twitter / X',
              'zh-CN': 'Twitter / X',
            },
        logoUrl: platform === AccountType.Facebook
          ? 'https://cdn.example.test/facebook.svg'
          : 'https://cdn.example.test/twitter.svg',
        authInstructions: platform === AccountType.Facebook
          ? undefined
          : {
              'en-US': 'Continue in the platform authorization window.',
              'zh-CN': '请在平台授权窗口中继续操作。',
            },
        emptyAccountHint: platform === AccountType.Facebook
          ? {
              title: {
                'en-US': 'No Facebook Page found',
                'zh-CN': '未找到 Facebook 公共主页',
              },
              description: {
                'en-US': 'Create a Facebook Page first, then authorize again.',
                'zh-CN': '请先创建 Facebook 公共主页后重新授权。',
              },
              action: {
                label: {
                  'en-US': 'Create Facebook Page',
                  'zh-CN': '创建 Facebook 公共主页',
                },
                url: 'https://www.facebook.com/pages/create',
              },
            }
          : undefined,
      },
    })),
  }
  const credentialService = {
    saveCredential: vi.fn(async () => undefined),
    getCredential: vi.fn(),
    lockRefresh: vi.fn(),
    unlockRefresh: vi.fn(),
    invalidateCredential: vi.fn(),
    deleteCredential: vi.fn(async () => undefined),
    deleteCredentialRecord: vi.fn(async () => undefined),
    tryRefresh: vi.fn(),
  }
  const accountRepo = {
    getByIdentity: vi.fn(async () => null),
    createByIdentity: vi.fn(async () => ({
      id: 'account-1',
      userId: 'user-1',
    })),
    updateByIdentity: vi.fn(async () => ({
      id: 'account-1',
      userId: 'user-1',
    })),
    getByIdAndUserId: vi.fn(),
    getAccountById: vi.fn(),
    updateById: vi.fn(),
  }
  const accountGroupRepo = {
    getById: vi.fn(async (id: string) => ({
      id,
      userId: 'user-1',
    })),
    getDefaultGroup: vi.fn(async () => ({
      id: 'group-default',
    })),
  }
  const redis = {
    saveChannelAuthSession: vi.fn(async () => true),
    getChannelAuthSession: vi.fn(),
  }
  const eventStream = {
    emit: vi.fn(async () => undefined),
  }
  const authTokenService = {
    generateToken: vi.fn(() => 'jwt-token'),
    decodeToken: vi.fn(() => ({ exp: 1800000000 })),
  }
  const userService = {
    getUserInfoById: vi.fn(async () => ({
      id: 'user-1',
      mail: 'user@example.test',
      name: 'User',
    })),
  }
  const identityRepo = {
    deleteByPlatformAndUserId: vi.fn(async () => undefined),
    deleteByPlatformAndSubjectUid: vi.fn(async () => undefined),
    createOrUpdateByPlatformAndSubjectUid: vi.fn(async () => ({
      id: 'identity-1',
    })),
  }

  return {
    service: new AuthService(
      registry as never,
      credentialService as never,
      accountRepo as never,
      accountGroupRepo as never,
      redis as never,
      eventStream as never,
    ),
    provider,
    credentialService,
    accountRepo,
    accountGroupRepo,
    redis,
    eventStream,
    authTokenService,
    userService,
    identityRepo,
  }
}

describe('channel auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts auth with backend-owned scopes and short random ids', async () => {
    const { service, provider, redis } = createService()

    const result = await service.startAuth({
      userId: 'user-1',
      platform: AccountType.Twitter,
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
    })

    expect(result.sessionId).toHaveLength(16)
    expect(provider.generateAuthUrl).toHaveBeenCalledTimes(1)

    const authInput = provider.generateAuthUrl.mock.calls[0][0]
    expect(authInput).toMatchObject({
      userId: 'user-1',
      deviceType: 'unknown',
    })
    expect(authInput.state).toHaveLength(16)
    expect(authInput.state).toBe(result.sessionId)
    expect(authInput).not.toHaveProperty('scopes')
    expect(authInput).not.toHaveProperty('callbackUrl')

    const savedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(redis.saveChannelAuthSession).toHaveBeenCalledWith(result.sessionId, savedSession)
    expect(savedSession).toMatchObject({
      flow: ChannelAuthSessionFlow.AccountAuth,
      id: result.sessionId,
      userId: 'user-1',
      platform: AccountType.Twitter,
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
    })
    expect(savedSession.redirectUri).not.toBe('https://api.example.test/v2/channels/accounts/auth/twitter/callback')
    expect(savedSession).not.toHaveProperty('state')
    expect(savedSession).not.toHaveProperty('authInstructions')
    expect(savedSession.createdAt).toBeInstanceOf(Date)
    expect(savedSession.expiresAt).toBeInstanceOf(Date)
    expect(result.expiresAt).toBe(savedSession.expiresAt)
    expect(result.authInstructions).toEqual({
      'en-US': 'Continue in the platform authorization window.',
      'zh-CN': '请在平台授权窗口中继续操作。',
    })
  })

  it('starts auth with a group owned by the current user', async () => {
    const { service, accountGroupRepo, redis } = createService()

    await service.startAuth({
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-1',
    })

    expect(accountGroupRepo.getById).toHaveBeenCalledWith('group-1')
    const savedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedSession.groupId).toBe('group-1')
  })

  it('rejects auth start when the requested group belongs to another user', async () => {
    const { service, provider, accountGroupRepo, redis } = createService()
    accountGroupRepo.getById.mockResolvedValueOnce({
      id: 'group-other',
      userId: 'user-other',
    })

    await expect(service.startAuth({
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-other',
    })).rejects.toMatchObject({
      code: ResponseCode.AccountGroupNotFound,
    })

    expect(provider.generateAuthUrl).not.toHaveBeenCalled()
    expect(redis.saveChannelAuthSession).not.toHaveBeenCalled()
  })

  it('passes parsed desktop device type to auth providers', async () => {
    const { service, provider } = createService()

    await service.startAuth({
      userId: 'user-1',
      platform: AccountType.Kwai,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    })

    expect(provider.generateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      deviceType: 'desktop',
    }))
  })

  it('passes explicit device type to auth providers before parsing user agent', async () => {
    const { service, provider } = createService()

    await service.startAuth({
      userId: 'user-1',
      platform: AccountType.Kwai,
      userAgent: '',
      deviceType: 'desktop',
    })

    expect(provider.generateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      deviceType: 'desktop',
    }))
  })

  it('lists existing channel account owners by OAuth profile and selectable account identities', async () => {
    const { service, accountRepo } = createService()
    accountRepo.getByIdentity.mockImplementation(async (identity: { type: AccountType, uid: string, account?: string }) => {
      if (identity.type === AccountType.Facebook && identity.uid === 'profile-1') {
        return { id: 'account-profile-1', userId: 'user-1' }
      }
      if (identity.type === AccountType.Facebook && identity.uid === 'page-1') {
        return { id: 'account-page-1', userId: 'user-1' }
      }
      if (identity.type === AccountType.YouTube && identity.uid === 'google-user-1' && identity.account === 'channel-1') {
        return { id: 'account-channel-1', userId: 'user-2' }
      }
      return null
    })

    const result = await service.listAccountOwnerIds({
      platform: AccountType.Facebook,
      profile: {
        platformUid: 'profile-1',
        displayName: 'Facebook User',
      },
      selectableAccounts: [
        {
          platform: AccountType.Facebook,
          platformUid: 'page-1',
          displayName: 'Page One',
        },
        {
          platform: AccountType.YouTube,
          platformUid: 'google-user-1',
          account: 'channel-1',
          displayName: 'Channel One',
        },
      ],
    })

    expect(accountRepo.getByIdentity).toHaveBeenCalledWith({ type: AccountType.Facebook, uid: 'profile-1', account: undefined })
    expect(accountRepo.getByIdentity).toHaveBeenCalledWith({ type: AccountType.Facebook, uid: 'page-1', account: undefined })
    expect(accountRepo.getByIdentity).toHaveBeenCalledWith({ type: AccountType.YouTube, uid: 'google-user-1', account: 'channel-1' })
    expect(result).toEqual(['user-1', 'user-2'])
  })

  it('returns a pending auth session status for polling', async () => {
    const { service, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    const result = await service.getAuthSessionResult('user-1', AccountType.Twitter, 'session-1')

    expect(result).toEqual({
      sessionId: 'session-1',
      status: ChannelAuthSessionStatus.Pending,
      requiresSelection: false,
      errorCode: undefined,
      accountId: undefined,
      accountIds: undefined,
      accounts: undefined,
      selectableAccounts: undefined,
    })
    expect(result).not.toHaveProperty('callbackUrl')
    expect(result).not.toHaveProperty('redirectUri')
  })

  it('returns failed auth session status with error code for polling', async () => {
    const { service, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Failed,
      errorCode: ResponseCode.ChannelAuthorizationFailed,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    await expect(service.getAuthSessionResult('user-1', AccountType.Twitter, 'session-1'))
      .resolves
      .toMatchObject({
        sessionId: 'session-1',
        status: ChannelAuthSessionStatus.Failed,
        requiresSelection: false,
        errorCode: ResponseCode.ChannelAuthorizationFailed,
      })
  })

  it('marks pending account auth sessions as failed and clears selectable snapshots', async () => {
    const { service, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        credential: {
          accessToken: 'page-access-token',
        },
      }],
      rootCredentialId: 'root-credential-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    await service.markSessionFailed('session-1', ResponseCode.ChannelAuthorizationFailed)

    const savedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedSession.status).toBe(ChannelAuthSessionStatus.Failed)
    expect(savedSession.errorCode).toBe(ResponseCode.ChannelAuthorizationFailed)
    expect(savedSession.selectableAccounts).toBeUndefined()
    expect(savedSession.rootCredentialId).toBeUndefined()
  })

  it('uses semantic redis access and enum status when completing callback', async () => {
    const { service, provider, credentialService, accountRepo, redis, eventStream } = createService()
    provider.getProfile.mockResolvedValueOnce({
      platformUid: 'platform-user',
      displayName: 'Platform User',
      fansCount: 120,
      followingCount: 15,
    })
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      redirectUri: 'https://client.example.test/redirect',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    const result = await service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(redis.getChannelAuthSession).toHaveBeenCalledWith('session-1')
    expect(provider.exchangeCode).toHaveBeenCalledWith({
      query: {
        code: 'code-1',
        state: 'session-1',
      },
      session,
    })
    expect(accountRepo.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform-user' },
      expect.objectContaining({
        userId: 'user-1',
        type: AccountType.Twitter,
        fansCount: 120,
        followingCount: 15,
      }),
    )
    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-1',
      AccountType.Twitter,
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    )
    expect(redis.saveChannelAuthSession).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        status: ChannelAuthSessionStatus.Completed,
      }),
    )
    expect(eventStream.emit).toHaveBeenCalled()
    expect(result.accountId).toBe('account-1')
    expect(result).toMatchObject({
      platformDisplayName: 'Twitter / X',
      platformLogoUrl: 'https://cdn.example.test/twitter.svg',
    })

    const savedSession = redis.saveChannelAuthSession.mock.calls[0][1]
    expect(savedSession).toMatchObject({
      accountId: 'account-1',
      accountIds: ['account-1'],
      accounts: [{
        accountId: 'account-1',
        platform: AccountType.Twitter,
        platformUid: 'platform-user',
        displayName: 'Platform User',
      }],
    })
  })

  it('stores mutable account handles without using them in the local account identity key', async () => {
    const { service, provider, accountRepo, redis } = createService()
    provider.getProfile.mockResolvedValueOnce({
      platformUid: 'platform-user',
      account: 'mutable_handle',
      displayName: 'Platform User',
    })
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    await service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(accountRepo.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform-user', account: undefined },
      expect.objectContaining({
        type: AccountType.Twitter,
        uid: 'platform-user',
        account: 'mutable_handle',
        nickname: 'Platform User',
      }),
    )
  })

  it('migrates a channel account owner when account auth completes', async () => {
    const { service, credentialService, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)
    accountRepo.getByIdentity.mockResolvedValueOnce({
      id: 'account-1',
      userId: 'user-2',
      type: AccountType.Twitter,
      uid: 'platform-user',
    })
    accountRepo.updateByIdentity.mockResolvedValueOnce({
      id: 'account-1',
      userId: 'user-1',
      type: AccountType.Twitter,
      uid: 'platform-user',
    })

    const result = await service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(accountRepo.updateByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform-user' },
      expect.objectContaining({
        userId: 'user-1',
        type: AccountType.Twitter,
        uid: 'platform-user',
      }),
    )
    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-1',
      AccountType.Twitter,
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    )
    expect(result.accountId).toBe('account-1')
  })

  it('restores abnormal channel account status when account auth completes again', async () => {
    const { service, credentialService, accountRepo, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)
    accountRepo.getByIdentity.mockResolvedValueOnce({
      id: 'account-1',
      userId: 'user-1',
      type: AccountType.Twitter,
      uid: 'platform-user',
      status: AccountStatus.ABNORMAL,
    })
    accountRepo.updateByIdentity.mockResolvedValueOnce({
      id: 'account-1',
      userId: 'user-1',
      type: AccountType.Twitter,
      uid: 'platform-user',
      status: AccountStatus.NORMAL,
    })

    const result = await service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(accountRepo.updateByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform-user' },
      expect.objectContaining({
        status: AccountStatus.NORMAL,
      }),
    )
    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-1',
      AccountType.Twitter,
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    )
    expect(result.accountId).toBe('account-1')
  })

  it('rejects account auth if the repository still returns a different owner after migration', async () => {
    const loggerWarn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    const { service, credentialService, accountRepo, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)
    accountRepo.getByIdentity.mockResolvedValueOnce({
      id: 'account-owned-by-user-2',
      userId: 'user-2',
      type: AccountType.Twitter,
      uid: 'platform-user',
    })
    accountRepo.updateByIdentity.mockResolvedValueOnce({
      id: 'account-owned-by-user-2',
      userId: 'user-2',
      type: AccountType.Twitter,
      uid: 'platform-user',
    })

    await expect(service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser,
    })
    expect(accountRepo.updateByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform-user' },
      expect.any(Object),
    )
    expect(credentialService.saveCredential).not.toHaveBeenCalled()
    loggerWarn.mockRestore()
  })

  it('does not sign a user token or write login identity for account auth JSON callback output', async () => {
    const { service, provider, redis, authTokenService, userService, identityRepo } = createService()
    provider.exchangeCode.mockResolvedValueOnce({
      accessToken: 'miniapp-access-token',
      refreshToken: 'miniapp-refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      callbackResponseType: AuthCallbackResponseType.Json,
      profile: {
        platformUid: 'douyin-openid',
        displayName: 'Douyin User',
      },
    })
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Douyin,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    const result = await service.completeCallback(
      AccountType.Douyin,
      {
        body: {
          state: 'session-1',
          token: 'login-token',
          tickets: {
            'ma.user.data': 'user-data-ticket',
            'ma.video.bind': 'video-bind-ticket',
          },
        },
      },
      'session-1',
    )

    expect(identityRepo.deleteByPlatformAndUserId).not.toHaveBeenCalled()
    expect(identityRepo.deleteByPlatformAndSubjectUid).not.toHaveBeenCalled()
    expect(identityRepo.createOrUpdateByPlatformAndSubjectUid).not.toHaveBeenCalled()
    expect(userService.getUserInfoById).not.toHaveBeenCalled()
    expect(authTokenService.generateToken).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      accountId: 'account-1',
      callbackResponseType: AuthCallbackResponseType.Json,
    })
    expect(result).not.toHaveProperty('token')
    expect(result).not.toHaveProperty('exp')
    expect(provider.getProfile).not.toHaveBeenCalled()
  })

  it('passes callback state validation responsibility to provider', async () => {
    const { service, provider, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    await service.completeCallback(
      AccountType.Twitter,
      { query: { code: 'code-1', state: 'other-session' } },
      'session-1',
    )

    expect(provider.exchangeCode).toHaveBeenCalledWith({
      query: { code: 'code-1', state: 'other-session' },
      session,
    })
  })

  it('returns a completed auth session status after callback', async () => {
    const { service, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Completed,
      accountId: 'account-1',
      accountIds: ['account-1'],
      accounts: [{
        accountId: 'account-1',
        platform: AccountType.Twitter,
        platformUid: 'platform-user',
        displayName: 'Platform User',
      }],
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    const result = await service.getAuthSessionResult('user-1', AccountType.Twitter, 'session-1')

    expect(result).toMatchObject({
      sessionId: 'session-1',
      status: ChannelAuthSessionStatus.Completed,
      requiresSelection: false,
      accountId: 'account-1',
      accountIds: ['account-1'],
    })
    expect(result).not.toHaveProperty('callbackUrl')
    expect(result).not.toHaveProperty('redirectUri')
  })

  it('keeps selectable accounts pending until user selection is submitted', async () => {
    const { service, provider, redis } = createService()
    provider.listSelectableAccounts = vi.fn(async () => [
      {
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        parentPlatformUid: 'profile-1',
        credential: {
          accessToken: 'page-access-token',
          refreshToken: 'page-refresh-token',
        },
      },
      {
        platform: AccountType.Facebook,
        platformUid: 'page-2',
        displayName: 'Page Two',
        parentPlatformUid: 'profile-1',
        credential: {
          accessToken: 'page-access-token-2',
          refreshToken: 'page-refresh-token',
        },
      },
    ])
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    const callbackResult = await service.completeCallback(
      AccountType.Facebook,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(callbackResult).toMatchObject({
      requiresSelection: true,
      platformDisplayName: 'Facebook',
      platformLogoUrl: 'https://cdn.example.test/facebook.svg',
      accounts: [{
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        parentPlatformUid: 'profile-1',
      }, {
        platform: AccountType.Facebook,
        platformUid: 'page-2',
        displayName: 'Page Two',
        parentPlatformUid: 'profile-1',
      }],
    })

    const savedPendingSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedPendingSession.status).toBe(ChannelAuthSessionStatus.Pending)
    expect(savedPendingSession.selectableAccounts).toHaveLength(2)

    redis.getChannelAuthSession.mockResolvedValue(savedPendingSession)
    await expect(service.getAuthSessionResult('user-1', AccountType.Facebook, 'session-1'))
      .resolves
      .toMatchObject({
        sessionId: 'session-1',
        status: ChannelAuthSessionStatus.Pending,
        requiresSelection: true,
        selectableAccounts: [{
          platform: AccountType.Facebook,
          platformUid: 'page-1',
          displayName: 'Page One',
          parentPlatformUid: 'profile-1',
        }, {
          platform: AccountType.Facebook,
          platformUid: 'page-2',
          displayName: 'Page Two',
          parentPlatformUid: 'profile-1',
        }],
      })
  })

  it('keeps empty selectable accounts pending with the platform empty account hint', async () => {
    const { service, provider, credentialService, accountRepo, redis } = createService()
    provider.listSelectableAccounts = vi.fn(async () => [])
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    const callbackResult = await service.completeCallback(
      AccountType.Facebook,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(callbackResult).toMatchObject({
      requiresSelection: true,
      accounts: [],
      emptyAccountHint: {
        title: 'No Facebook Page found',
        description: 'Create a Facebook Page first, then authorize again.',
        action: {
          label: 'Create Facebook Page',
          url: 'https://www.facebook.com/pages/create',
        },
      },
    })
    expect(accountRepo.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepo.updateByIdentity).not.toHaveBeenCalled()
    expect(credentialService.saveCredential).not.toHaveBeenCalled()

    const savedPendingSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedPendingSession).toMatchObject({
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [],
    })
  })

  it('connects the only selectable account without rendering the selection step', async () => {
    const { service, provider, credentialService, accountRepo, redis } = createService()
    provider.listSelectableAccounts = vi.fn(async () => [{
      platform: AccountType.Facebook,
      platformUid: 'page-1',
      displayName: 'Page One',
      parentPlatformUid: 'profile-1',
      avatarUrl: 'https://cdn.example.test/page-1.png',
      fansCount: 300,
      followingCount: 9,
      credential: {
        accessToken: 'page-access-token',
        refreshToken: 'page-refresh-token',
      },
    }])
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)
    accountRepo.createByIdentity.mockResolvedValue({ id: 'account-page-1', userId: 'user-1' })

    const callbackResult = await service.completeCallback(
      AccountType.Facebook,
      { query: { code: 'code-1', state: 'session-1' } },
      'session-1',
    )

    expect(callbackResult.requiresSelection).toBeUndefined()
    expect(accountRepo.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Facebook, uid: 'page-1' },
      expect.objectContaining({
        fansCount: 300,
        followingCount: 9,
      }),
    )
    expect(callbackResult).toMatchObject({
      accountId: 'account-page-1',
      connectedAccounts: [{
        accountId: 'account-page-1',
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        avatarUrl: 'https://cdn.example.test/page-1.png',
      }],
      platformDisplayName: 'Facebook',
      platformLogoUrl: 'https://cdn.example.test/facebook.svg',
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
    })
    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-page-1',
      AccountType.Facebook,
      {
        accessToken: 'page-access-token',
        refreshToken: 'page-refresh-token',
        expiresAt: undefined,
      },
    )

    const savedCompletedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedCompletedSession).toMatchObject({
      status: ChannelAuthSessionStatus.Completed,
      accountId: 'account-page-1',
      accountIds: ['account-page-1'],
      accounts: [{
        accountId: 'account-page-1',
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        avatarUrl: 'https://cdn.example.test/page-1.png',
      }],
    })
    expect(savedCompletedSession.selectableAccounts).toBeUndefined()
  })

  it('stores selected accounts and returns them from polling', async () => {
    const { service, credentialService, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.YouTube,
      groupId: 'group-default',
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.YouTube,
        platformUid: 'google-user-1',
        account: 'channel-1',
        displayName: 'Channel One',
        credential: {
          accessToken: 'channel-access-token',
          refreshToken: 'channel-refresh-token',
        },
      }],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)
    accountRepo.createByIdentity.mockResolvedValue({ id: 'account-channel-1', userId: 'user-1' })

    const result = await service.connectSelectableAccounts('session-1', [{
      platformUid: 'google-user-1',
      account: 'channel-1',
    }])

    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-channel-1',
      AccountType.YouTube,
      {
        accessToken: 'channel-access-token',
        refreshToken: 'channel-refresh-token',
        expiresAt: undefined,
      },
    )
    expect(accountRepo.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.YouTube, uid: 'google-user-1', account: 'channel-1' },
      expect.objectContaining({
        type: AccountType.YouTube,
        uid: 'google-user-1',
        account: 'channel-1',
        nickname: 'Channel One',
      }),
    )

    const savedCompletedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedCompletedSession).toMatchObject({
      status: ChannelAuthSessionStatus.Completed,
      accountId: 'account-channel-1',
      accountIds: ['account-channel-1'],
      accounts: [{
        accountId: 'account-channel-1',
        platform: AccountType.YouTube,
        platformUid: 'google-user-1',
        account: 'channel-1',
        displayName: 'Channel One',
      }],
    })
    expect(savedCompletedSession.selectableAccounts).toBeUndefined()
    expect(result).toMatchObject({
      accountIds: ['account-channel-1'],
      callbackUrl: 'https://client.example.test/callback',
      redirectUri: 'https://client.example.test/redirect',
    })

    redis.getChannelAuthSession.mockResolvedValue(savedCompletedSession)
    await expect(service.getAuthSessionResult('user-1', AccountType.YouTube, 'session-1'))
      .resolves
      .toMatchObject({
        sessionId: 'session-1',
        status: ChannelAuthSessionStatus.Completed,
        requiresSelection: false,
        accountId: 'account-channel-1',
        accountIds: ['account-channel-1'],
      })
  })

  it('updates existing YouTube channel accounts found by persisted identity fields', async () => {
    const { service, credentialService, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.YouTube,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.YouTube,
        platformUid: 'google-user-1',
        account: 'channel-1',
        displayName: 'Channel One',
        credential: {
          accessToken: 'channel-access-token',
          refreshToken: 'channel-refresh-token',
        },
      }],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)
    accountRepo.getByIdentity.mockResolvedValueOnce({
      id: 'youtube_google-user-1',
      userId: 'user-1',
    })
    accountRepo.updateByIdentity.mockResolvedValueOnce({
      id: 'youtube_google-user-1',
      userId: 'user-1',
    })

    await service.connectSelectableAccounts('session-1', [{
      platformUid: 'google-user-1',
      account: 'channel-1',
    }])

    expect(accountRepo.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepo.updateByIdentity).toHaveBeenCalledWith(
      { type: AccountType.YouTube, uid: 'google-user-1', account: 'channel-1' },
      expect.objectContaining({
        type: AccountType.YouTube,
        uid: 'google-user-1',
        account: 'channel-1',
        nickname: 'Channel One',
      }),
    )
    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'youtube_google-user-1',
      AccountType.YouTube,
      {
        accessToken: 'channel-access-token',
        refreshToken: 'channel-refresh-token',
        expiresAt: undefined,
      },
    )
  })

  it('stores selected accounts when the platform credential omits refresh token', async () => {
    const { service, credentialService, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
        credential: {
          accessToken: 'page-access-token',
        },
      }],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)
    accountRepo.createByIdentity.mockResolvedValue({ id: 'account-page-1', userId: 'user-1' })

    await service.connectSelectableAccounts('session-1', [{ platformUid: 'page-1' }])

    expect(credentialService.saveCredential).toHaveBeenCalledWith(
      'account-page-1',
      AccountType.Facebook,
      {
        accessToken: 'page-access-token',
        refreshToken: undefined,
        expiresAt: undefined,
      },
    )
    const savedCompletedSession = redis.saveChannelAuthSession.mock.calls[0][1] as AuthSession
    expect(savedCompletedSession.status).toBe(ChannelAuthSessionStatus.Completed)
    expect(savedCompletedSession.accountIds).toEqual(['account-page-1'])
  })

  it('rejects empty selectable account submissions with a stable response code', async () => {
    const { service, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
      }],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    await expect(service.connectSelectableAccounts('session-1', []))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthSelectionRequired })
    expect(accountRepo.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepo.updateByIdentity).not.toHaveBeenCalled()
  })

  it('rejects selectable account ids outside the auth session with a stable response code', async () => {
    const { service, accountRepo, redis } = createService()
    const session: AuthSession = {
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Facebook,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      selectableAccounts: [{
        platform: AccountType.Facebook,
        platformUid: 'page-1',
        displayName: 'Page One',
      }],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    redis.getChannelAuthSession.mockResolvedValue(session)

    await expect(service.connectSelectableAccounts('session-1', [{ platformUid: 'page-2' }]))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthSelectedAccountUnavailable })
    expect(accountRepo.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepo.updateByIdentity).not.toHaveBeenCalled()
  })

  it('rejects polling when session owner or platform does not match', async () => {
    const { service, redis } = createService()
    redis.getChannelAuthSession.mockResolvedValue({
      id: 'session-1',
      flow: ChannelAuthSessionFlow.AccountAuth,
      userId: 'user-1',
      platform: AccountType.Twitter,
      groupId: 'group-default',
      status: ChannelAuthSessionStatus.Pending,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies AuthSession)

    await expect(service.getAuthSessionResult('user-2', AccountType.Twitter, 'session-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthSessionInvalid })
    await expect(service.getAuthSessionResult('user-1', AccountType.Facebook, 'session-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthPlatformMismatch })
  })

  it('returns account auth status only for the owning user and platform', async () => {
    const { service, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      uid: 'platform-user-1',
      status: AccountStatus.NORMAL,
    })

    await expect(service.getAccountAuthStatus('user-1', AccountType.Twitter, 'account-1'))
      .resolves
      .toEqual({ status: AccountStatus.NORMAL })

    await expect(service.getAccountAuthStatus('user-1', AccountType.Facebook, 'account-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthPlatformMismatch })
  })

  it('revokes provider credential before marking account offline', async () => {
    const { service, provider, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      uid: 'platform-user-1',
      status: AccountStatus.NORMAL,
    })
    accountRepo.getAccountById.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
    })
    credentialService.getCredential.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    await service.revokeCredential('account-1', 'user-1')

    expect(provider.revoke).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      platformUid: 'platform-user-1',
    })
    expect(accountRepo.updateById).toHaveBeenCalledWith('account-1', { status: AccountStatus.ABNORMAL })
    expect(credentialService.invalidateCredential).toHaveBeenCalledWith('account-1')
    expect(credentialService.deleteCredentialRecord).toHaveBeenCalledWith('account-1')
    expect(credentialService.deleteCredential).not.toHaveBeenCalled()
  })

  it('rejects credential reads for abnormal accounts', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.ABNORMAL,
    })

    await expect(service.getValidCredential('account-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAccountNotAuthorized })
    expect(credentialService.getCredential).not.toHaveBeenCalled()
  })

  it('marks the account offline when an owned account has no credential', async () => {
    const { service, credentialService, accountRepo, eventStream } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    accountRepo.getAccountById.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
    })
    credentialService.getCredential.mockResolvedValue(null)

    await expect(service.getValidCredential('account-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelCredentialNotFound })
    expect(accountRepo.updateById).toHaveBeenCalledWith('account-1', { status: AccountStatus.ABNORMAL })
    expect(credentialService.invalidateCredential).toHaveBeenCalledWith('account-1')
    expect(eventStream.emit).toHaveBeenCalledWith(
      'channels',
      'channels.account.offline',
      { accountId: 'account-1', platform: AccountType.Twitter, reason: 'credential_not_found' },
      { source: 'auth' },
    )
  })

  it('marks the account offline for non-retryable platform auth failures', async () => {
    const { service, accountRepo } = createService()
    const error = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.Twitter,
      category: PlatformErrorCategory.Auth,
      retryable: false,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 401,
      },
    })

    await expect(service.markAccountOfflineForCredentialFailure('account-1', error, 'platform_auth_failed'))
      .resolves
      .toBe(true)

    expect(accountRepo.updateById).toHaveBeenCalledWith('account-1', { status: AccountStatus.ABNORMAL })
  })

  it('keeps the account online for retryable platform auth failures', async () => {
    const { service, accountRepo, credentialService } = createService()
    const error = new ChannelPlatformException({
      code: ResponseCode.ChannelAccessTokenFailed,
      platform: AccountType.Twitter,
      category: PlatformErrorCategory.Auth,
      retryable: true,
      cause: {
        type: PlatformErrorCauseType.Http,
        httpStatus: 503,
      },
    })

    await expect(service.markAccountOfflineForCredentialFailure('account-1', error, 'platform_auth_failed'))
      .resolves
      .toBe(false)

    expect(accountRepo.updateById).not.toHaveBeenCalled()
    expect(credentialService.invalidateCredential).not.toHaveBeenCalled()
  })

  it('keeps the account online for platform permission failures', async () => {
    const { service, accountRepo, credentialService } = createService()
    const error = new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformPermissionMissing,
      platform: AccountType.TikTok,
      category: PlatformErrorCategory.Permission,
      retryable: false,
      context: { endpoint: 'assertCreatorInteractionOptions' },
      cause: {
        type: PlatformErrorCauseType.Validation,
      },
    })

    await expect(service.markAccountOfflineForCredentialFailure('account-1', error, 'platform_auth_failed'))
      .resolves
      .toBe(false)

    expect(accountRepo.updateById).not.toHaveBeenCalled()
    expect(credentialService.invalidateCredential).not.toHaveBeenCalled()
  })

  it('refreshes credential through the credential service', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    credentialService.tryRefresh.mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
    })

    await expect(service.refreshCredential('account-1', 'user-1')).resolves.toEqual({
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
    })

    expect(credentialService.tryRefresh).toHaveBeenCalledWith({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
  })

  it('refreshes historical YouTube credentials that have no stored expiry', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.YouTube,
      status: AccountStatus.NORMAL,
    })
    credentialService.getCredential.mockResolvedValue({
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      scope: 'https://www.googleapis.com/auth/youtube',
    })
    credentialService.tryRefresh.mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scope: 'https://www.googleapis.com/auth/youtube',
    })

    await expect(service.getValidCredential('account-1', 'user-1')).resolves.toEqual({
      accessToken: 'new-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scope: 'https://www.googleapis.com/auth/youtube',
    })
    expect(credentialService.tryRefresh).toHaveBeenCalledWith({
      id: 'account-1',
      type: AccountType.YouTube,
      status: AccountStatus.NORMAL,
    })
  })

  it('fails direct credential refresh when another refresh owns the lock', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    credentialService.tryRefresh.mockResolvedValue(null)

    await expect(service.refreshCredential('account-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAccessTokenFailed })

    expect(credentialService.getCredential).not.toHaveBeenCalled()
  })

  it('waits for a refreshed credential only while getting a valid credential', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    credentialService.getCredential.mockResolvedValue({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: 1,
    })
    const refreshedExpiresAt = Math.floor(Date.now() / 1000) + 3600
    credentialService.getCredential.mockResolvedValueOnce({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: 1,
    }).mockResolvedValueOnce({
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
      expiresAt: refreshedExpiresAt,
    })
    credentialService.tryRefresh.mockResolvedValue(null)

    await expect(service.getValidCredential('account-1', 'user-1')).resolves.toEqual({
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(refreshedExpiresAt * 1000),
      scope: undefined,
    })
  })

  it('does not wait for a refreshed credential when refresh itself fails', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    credentialService.getCredential.mockResolvedValue({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: 1,
    })
    credentialService.tryRefresh.mockRejectedValue(new AppException(ResponseCode.ChannelRefreshTokenFailed))

    await expect(service.getValidCredential('account-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelRefreshTokenFailed })

    expect(credentialService.getCredential).toHaveBeenCalledTimes(1)
    expect(accountRepo.updateById).toHaveBeenCalledWith('account-1', { status: AccountStatus.ABNORMAL })
    expect(credentialService.invalidateCredential).toHaveBeenCalledWith('account-1')
  })

  it('marks the account offline when direct credential refresh fails', async () => {
    const { service, credentialService, accountRepo } = createService()
    accountRepo.getByIdAndUserId.mockResolvedValue({
      id: 'account-1',
      type: AccountType.Twitter,
      status: AccountStatus.NORMAL,
    })
    credentialService.tryRefresh.mockRejectedValue(new AppException(ResponseCode.ChannelRefreshTokenFailed))

    await expect(service.refreshCredential('account-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelRefreshTokenFailed })

    expect(accountRepo.updateById).toHaveBeenCalledWith('account-1', { status: AccountStatus.ABNORMAL })
    expect(credentialService.invalidateCredential).toHaveBeenCalledWith('account-1')
  })
})
