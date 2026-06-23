import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms/platforms.exception'
import { AuthType } from '../platforms/platforms.interface'
import { WorkService } from './work.service'

vi.mock('@yikart/mongodb', () => ({
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
  AccountRepository: class AccountRepository {},
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
}))

vi.mock('@yikart/channel-db', () => ({
  ChannelWorkDataSnapshotRepository: class ChannelWorkDataSnapshotRepository {},
}))

vi.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}))

describe('work service', () => {
  it('uses the explicit platform route parameter for work detail', async () => {
    const fetchedAt = new Date('2026-06-01T00:00:00.000Z')
    const getDetail = vi.fn()
    const provider = { getDetail }
    getDetail.mockImplementation(function (this: unknown) {
      expect(this).toBe(provider)
      return Promise.resolve({
        snapshots: [{
          platformWorkId: 'video-id',
          snapshotAt: fetchedAt,
          fetchedAt,
          work: { id: 'video-id' },
        }],
      })
    })
    const registry = {
      getWork: vi.fn().mockReturnValue(provider),
    }
    const authService = {
      getValidCredential: vi.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'account-id', type: AccountType.YouTube }),
    }
    const workSnapshotRepository = {
      createMany: vi.fn(async data => data.map((item: Record<string, unknown>, index: number) => ({ ...item, id: `snapshot-${index}` }))),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, workSnapshotRepository as never)

    const result = await service.getDetail('user-id', AccountType.YouTube, 'video-id', 'account-id')

    expect(registry.getWork).toHaveBeenCalledWith(AccountType.YouTube)
    expect(getDetail).toHaveBeenCalledWith({
      accountId: 'account-id',
      platform: AccountType.YouTube,
      platformWorkId: 'video-id',
      credential: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    })
    expect(workSnapshotRepository.createMany).toHaveBeenCalledWith([{
      userId: 'user-id',
      platform: AccountType.YouTube,
      accountId: 'account-id',
      platformWorkId: 'video-id',
      snapshotAt: fetchedAt,
      fetchedAt,
      periodStartAt: undefined,
      periodEndAt: undefined,
      work: { id: 'video-id' },
      metrics: undefined,
      extra: undefined,
      rawResponse: undefined,
    }])
    expect(result).toEqual({
      platform: AccountType.YouTube,
      work: { id: 'video-id' },
      snapshots: [{
        id: 'snapshot-0',
        userId: 'user-id',
        platform: AccountType.YouTube,
        accountId: 'account-id',
        platformWorkId: 'video-id',
        snapshotAt: fetchedAt,
        fetchedAt,
        periodStartAt: undefined,
        periodEndAt: undefined,
        work: { id: 'video-id' },
        metrics: undefined,
        extra: undefined,
        rawResponse: undefined,
      }],
      extra: undefined,
      snapshotId: 'snapshot-0',
      fetchedAt,
    })
  })

  it('rejects accounts from another platform', async () => {
    const registry = {
      getWork: vi.fn().mockReturnValue({ getDetail: vi.fn() }),
    }
    const authService = {
      getValidCredential: vi.fn(),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'account-id', type: AccountType.TikTok }),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, {} as never)

    await expect(service.getDetail('user-id', AccountType.YouTube, 'video-id', 'account-id'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelAuthPlatformMismatch })
    expect(authService.getValidCredential).not.toHaveBeenCalled()
  })

  it('marks the account offline when work provider returns an auth failure', async () => {
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
    const getDetail = vi.fn(async () => {
      throw platformError
    })
    const registry = {
      getWork: vi.fn().mockReturnValue({ getDetail }),
    }
    const authService = {
      getValidCredential: vi.fn().mockResolvedValue({ accessToken: 'access-token' }),
      markAccountOfflineForCredentialFailure: vi.fn(async () => true),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'account-id', type: AccountType.YouTube }),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, {} as never)

    await expect(service.getDetail('user-id', AccountType.YouTube, 'video-id', 'account-id'))
      .rejects
      .toBe(platformError)

    expect(authService.markAccountOfflineForCredentialFailure).toHaveBeenCalledWith(
      'account-id',
      platformError,
      'platform_auth_failed',
    )
  })

  it('throws when work detail capability is not supported', async () => {
    const registry = {
      getWork: vi.fn().mockReturnValue({}),
    }
    const authService = {
      getValidCredential: vi.fn(),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn(),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, {} as never)

    await expect(service.getDetail('user-id', AccountType.YouTube, 'video-id', 'account-id'))
      .rejects
      .toMatchObject({
        code: ResponseCode.ChannelPlatformOperationNotSupported,
      })
    expect(accountRepository.getByIdAndUserId).not.toHaveBeenCalled()
    expect(authService.getValidCredential).not.toHaveBeenCalled()
  })

  it('does not infer work context from platformWorkId when account is missing', async () => {
    const registry = {
      getWork: vi.fn().mockReturnValue({ getDetail: vi.fn() }),
    }
    const authService = {
      getValidCredential: vi.fn(),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn(),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, {} as never)

    await expect(service.getDetail('user-id', AccountType.YouTube, 'video-id'))
      .rejects
      .toMatchObject({ code: ResponseCode.AccountAuthRequired })
    expect(accountRepository.getByIdAndUserId).not.toHaveBeenCalled()
    expect(authService.getValidCredential).not.toHaveBeenCalled()
  })

  it('does not load credentials for plugin platform link info', async () => {
    const getLinkInfo = vi.fn().mockResolvedValue({
      snapshots: [],
      work: { id: 'feed-id', url: 'https://channels.weixin.qq.com/web/pages/feed?feedId=feed-id' },
    })
    const registry = {
      get: vi.fn().mockReturnValue({
        metadata: { authType: AuthType.Plugin },
        work: { getLinkInfo },
      }),
    }
    const authService = {
      getValidCredential: vi.fn(),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'wxSph_uid-1', type: AccountType.WeChatChannels }),
    }
    const workSnapshotRepository = {
      createMany: vi.fn(async () => []),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, workSnapshotRepository as never)

    await expect(service.getLinkInfo('user-id', AccountType.WeChatChannels, 'https://weixin.qq.com/sph/short-id', 'wxSph_uid-1', 'platform-work-id'))
      .resolves
      .toMatchObject({
        platform: AccountType.WeChatChannels,
        work: { id: 'feed-id' },
      })

    expect(registry.get).toHaveBeenCalledWith(AccountType.WeChatChannels)
    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('wxSph_uid-1', 'user-id')
    expect(authService.getValidCredential).not.toHaveBeenCalled()
    expect(getLinkInfo).toHaveBeenCalledWith({
      accountId: 'wxSph_uid-1',
      platform: AccountType.WeChatChannels,
      credential: undefined,
      link: 'https://weixin.qq.com/sph/short-id',
      dataId: 'platform-work-id',
    })
  })

  it('loads credentials for oauth platform link info', async () => {
    const getLinkInfo = vi.fn().mockResolvedValue({
      snapshots: [],
      work: { id: 'video-id' },
    })
    const registry = {
      get: vi.fn().mockReturnValue({
        metadata: { authType: AuthType.OAuth2 },
        work: { getLinkInfo },
      }),
    }
    const authService = {
      getValidCredential: vi.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
    }
    const accountRepository = {
      getByIdAndUserId: vi.fn().mockResolvedValue({ id: 'account-id', type: AccountType.YouTube, uid: 'channel-id' }),
    }
    const workSnapshotRepository = {
      createMany: vi.fn(async () => []),
    }
    const service = new WorkService(registry as never, authService as never, accountRepository as never, workSnapshotRepository as never)

    await service.getLinkInfo('user-id', AccountType.YouTube, 'https://youtube.com/watch?v=video-id', 'account-id')

    expect(authService.getValidCredential).toHaveBeenCalledWith('account-id', 'user-id')
    expect(getLinkInfo).toHaveBeenCalledWith({
      accountId: 'account-id',
      platform: AccountType.YouTube,
      credential: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        platformUid: 'channel-id',
        account: undefined,
      },
      link: 'https://youtube.com/watch?v=video-id',
    })
  })
})
