import { AccountType, ResponseCode } from '@yikart/common'
import { AccountStatus, ClientType } from '@yikart/mongodb'
import { EventStream, EventTopic } from '@yikart/redis'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthType, PlatformStatus } from '../platforms/platforms.interface'
import { AccountService } from './account.service'

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
  AccountStatus: {
    NORMAL: 1,
    ABNORMAL: 0,
  },
  ClientType: {
    WEB: 'web',
    APP: 'app',
  },
  Transactional: () => () => undefined,
  AccountGroupRepository: class AccountGroupRepository {},
  AccountRepository: class AccountRepository {},
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
}))

vi.mock('@yikart/redis', () => ({
  EventStream: { Channels: 'channels' },
  EventStreamService: class EventStreamService {},
  EventTopic: { ChannelsAccountConnected: 'channels.account.connected' },
  RedisService: class RedisService {},
}))

vi.mock('../relay/relay-client.service', () => ({
  RelayClientService: class RelayClientService {},
}))

function createService(options: {
  hasPlatform?: boolean
  authType?: AuthType
  status?: PlatformStatus
  channelsAuthData?: Record<string, unknown>
  relayClientService?: Record<string, unknown>
} = {}) {
  const accountRepository = {
    getByIdAndUserId: vi.fn(async () => ({
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.Twitter,
    })),
    updateById: vi.fn(async (id: string, data: Record<string, unknown>) => ({
      id,
      userId: 'user_1',
      type: AccountType.Twitter,
      ...data,
    })),
    getByIdentity: vi.fn(async () => null),
    createByIdentity: vi.fn(async (_identity: unknown, data: Record<string, unknown>) => ({
      id: 'account_1',
      ...data,
    })),
    updateByIdentity: vi.fn(async (_identity: unknown, data: Record<string, unknown>) => ({
      id: 'account_1',
      ...data,
    })),
    deleteByIdAndUserId: vi.fn(async () => true),
    deleteByUserIdAndIds: vi.fn(async () => true),
    listByUserIdAndIds: vi.fn(async () => [{
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.Twitter,
    }]),
  }
  const accountGroupRepository = {
    getDefaultGroup: vi.fn(async () => ({ id: 'group_default' })),
    getAccountGorupListByIds: vi.fn(async () => [{ id: 'group_custom' }]),
  }
  const platformRegistry = {
    has: vi.fn(() => options.hasPlatform ?? true),
    get: vi.fn(() => ({
      status: options.status,
      metadata: {
        authType: options.authType ?? AuthType.Plugin,
      },
    })),
  }
  const wechatService = {
    getChannelsAuthData: vi.fn(async () => options.channelsAuthData ?? {
      uid: 'wechat_channels_uid',
      nickname: 'WeChat Channels Account',
      avatar: 'https://assets.example.test/avatar.jpg',
      fansCount: 123,
    }),
  }
  const credentialService = {
    deleteCredential: vi.fn(async () => undefined),
  }
  const eventStream = {
    emit: vi.fn(async () => 'event_1'),
  }

  return {
    service: new AccountService(
      accountRepository as never,
      accountGroupRepository as never,
      platformRegistry as never,
      eventStream as never,
      credentialService as never,
      wechatService as never,
      options.relayClientService as never,
    ),
    accountRepository,
    accountGroupRepository,
    platformRegistry,
    wechatService,
    credentialService,
    eventStream,
  }
}

describe('channel account service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows creating WeChat Channels accounts when the platform is an available plugin platform', async () => {
    const { service, accountRepository, eventStream } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    const account = await service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
      loginCookie: 'sessionid=abc',
    })

    expect(account).toMatchObject({
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.WeChatChannels,
      uid: 'wechat_channels_uid',
      nickname: 'WeChat Channels Account',
      groupId: 'group_default',
      loginCookie: 'sessionid=abc',
      fansCount: 123,
    })
    expect(account).not.toHaveProperty('account')
    expect(account).not.toHaveProperty('channelId')
    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.WeChatChannels, uid: 'wechat_channels_uid' },
      expect.objectContaining({
        userId: 'user_1',
        type: AccountType.WeChatChannels,
        uid: 'wechat_channels_uid',
        groupId: 'group_default',
        loginCookie: 'sessionid=abc',
        fansCount: 123,
      }),
    )
    expect(accountRepository.createByIdentity.mock.calls[0][1]).not.toHaveProperty('account')
    expect(accountRepository.createByIdentity.mock.calls[0][1]).not.toHaveProperty('channelId')
    expect(eventStream.emit).toHaveBeenCalledWith(
      EventStream.Channels,
      EventTopic.ChannelsAccountConnected,
      {
        userId: 'user_1',
        accountId: 'account_1',
        platform: AccountType.WeChatChannels,
      },
      { source: 'account-service' },
    )
  })

  it('emits account connected events for manually created plugin accounts', async () => {
    const { service, eventStream } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
    })

    expect(eventStream.emit).toHaveBeenCalledWith(
      EventStream.Channels,
      EventTopic.ChannelsAccountConnected,
      {
        userId: 'user_1',
        accountId: 'account_1',
        platform: AccountType.RedNote,
      },
      { source: 'account-service' },
    )
  })

  it('restores abnormal plugin account status when the account is authorized again', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })
    accountRepository.getByIdentity.mockResolvedValueOnce({
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.WeChatChannels,
      uid: 'wechat_channels_uid',
      status: AccountStatus.ABNORMAL,
    })
    accountRepository.updateByIdentity.mockResolvedValueOnce({
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.WeChatChannels,
      uid: 'wechat_channels_uid',
      status: AccountStatus.NORMAL,
    })

    await service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
      loginCookie: 'sessionid=abc',
    })

    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepository.updateByIdentity).toHaveBeenCalledWith(
      { type: AccountType.WeChatChannels, uid: 'wechat_channels_uid' },
      expect.objectContaining({
        status: AccountStatus.NORMAL,
        loginCookie: 'sessionid=abc',
      }),
    )
  })

  it('defaults RedNote client type to web when creating manual plugin accounts', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
    })

    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      {
        type: AccountType.RedNote,
        uid: 'rednote_uid',
        clientType: ClientType.WEB,
      },
      expect.objectContaining({
        type: AccountType.RedNote,
        uid: 'rednote_uid',
        clientType: ClientType.WEB,
      }),
    )
  })

  it('keeps resolved default group when plugin input has undefined groupId', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
      groupId: undefined,
    })

    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AccountType.RedNote,
        uid: 'rednote_uid',
      }),
      expect.objectContaining({
        groupId: 'group_default',
        userId: 'user_1',
        status: AccountStatus.NORMAL,
      }),
    )
  })

  it('keeps explicit RedNote client type when creating manual plugin accounts', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
      clientType: ClientType.APP,
    })

    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      {
        type: AccountType.RedNote,
        uid: 'rednote_uid',
        clientType: ClientType.APP,
      },
      expect.objectContaining({
        type: AccountType.RedNote,
        uid: 'rednote_uid',
        clientType: ClientType.APP,
      }),
    )
  })

  it('rejects plugin account creation when the platform uid belongs to another user', async () => {
    const { service, accountRepository, eventStream } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })
    accountRepository.getByIdentity.mockResolvedValueOnce({
      id: 'account_2',
      userId: 'user_2',
      type: AccountType.WeChatChannels,
      uid: 'wechat_channels_uid',
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
      loginCookie: 'sessionid=abc',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepository.updateByIdentity).not.toHaveBeenCalled()
    expect(eventStream.emit).not.toHaveBeenCalled()
  })

  it('rejects WeChat Channels creation when request uid mismatches platform auth data', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
      channelsAuthData: {
        uid: 'actual_uid',
        nickname: 'WeChat Channels Account',
      },
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
      uid: 'other_uid',
      loginCookie: 'sessionid=abc',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformResponseInvalid,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
  })

  it('does not persist client supplied account or legacy channel id for WeChat Channels accounts', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
      loginCookie: 'sessionid=abc',
      account: 'client-account',
      channelId: 'client-channel',
    } as never)

    expect(accountRepository.createByIdentity.mock.calls[0][1]).not.toHaveProperty('account')
    expect(accountRepository.createByIdentity.mock.calls[0][1]).not.toHaveProperty('channelId')
  })

  it('requires loginCookie for WeChat Channels account creation', async () => {
    const { service, accountRepository, wechatService } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.WeChatChannels,
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountCreateRequiredFieldMissing,
    })
    expect(wechatService.getChannelsAuthData).not.toHaveBeenCalled()
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
  })

  it('keeps manual plugin account creation explicit for non-cookie platforms', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.Plugin,
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.RedNote,
      loginCookie: 'cookie',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountCreateRequiredFieldMissing,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
  })

  it('rejects account creation for non-plugin platforms', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.Available,
      authType: AuthType.OAuth2,
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.YouTube,
      uid: 'youtube_uid',
      nickname: 'YouTube Account',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountCreateNotSupported,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
  })

  it('rejects account creation for non-available plugin platforms', async () => {
    const { service, accountRepository } = createService({
      status: PlatformStatus.ComingSoon,
      authType: AuthType.Plugin,
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountCreateNotSupported,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
  })

  it('rejects account creation for unregistered platforms', async () => {
    const { service, accountRepository, platformRegistry, eventStream } = createService({
      hasPlatform: false,
    })

    await expect(service.addAccount('user_1', {
      type: AccountType.RedNote,
      uid: 'rednote_uid',
      nickname: 'RedNote Account',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountCreateNotSupported,
    })
    expect(platformRegistry.get).not.toHaveBeenCalled()
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
    expect(eventStream.emit).not.toHaveBeenCalled()
  })

  it('updates account info only after user ownership is verified', async () => {
    const { service, accountRepository, accountGroupRepository } = createService()

    await expect(service.updateAccountInfoById('user_1', 'account_1', {
      nickname: 'Updated Name',
      avatar: 'https://cdn.example.test/avatar.png',
      groupId: 'group_custom',
    })).resolves.toMatchObject({
      id: 'account_1',
      userId: 'user_1',
      nickname: 'Updated Name',
    })

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(accountGroupRepository.getAccountGorupListByIds).toHaveBeenCalledWith(['group_custom'], 'user_1')
    expect(accountRepository.updateById).toHaveBeenCalledWith('account_1', {
      nickname: 'Updated Name',
      avatar: 'https://cdn.example.test/avatar.png',
      groupId: 'group_custom',
    })
  })

  it('does not write identity or credential fields through account info update', async () => {
    const { service, accountRepository } = createService()

    await service.updateAccountInfoById('user_1', 'account_1', {
      nickname: 'Updated Name',
      uid: 'evil-uid',
      type: AccountType.YouTube,
      access_token: 'access-token',
    } as never)

    expect(accountRepository.updateById).toHaveBeenCalledWith('account_1', {
      nickname: 'Updated Name',
    })
  })

  it('rejects moving an account into a group outside the user scope', async () => {
    const { service, accountRepository, accountGroupRepository } = createService()
    accountGroupRepository.getAccountGorupListByIds.mockResolvedValueOnce([])

    await expect(service.updateAccountInfoById('user_1', 'account_1', {
      groupId: 'group_other',
    })).rejects.toMatchObject({
      code: ResponseCode.AccountGroupNotFound,
    })

    expect(accountRepository.updateById).not.toHaveBeenCalled()
  })

  it('throws when updating an account outside the user scope', async () => {
    const { service, accountRepository } = createService()
    accountRepository.getByIdAndUserId.mockResolvedValueOnce(null)

    await expect(service.updateAccountInfoById('user_1', 'account_2', {
      nickname: 'Updated Name',
    })).rejects.toMatchObject({
      code: ResponseCode.AccountNotFound,
    })

    expect(accountRepository.updateById).not.toHaveBeenCalled()
  })

  it('deletes credential storage after deleting an owned account', async () => {
    const { service, accountRepository, credentialService } = createService()

    await expect(service.delete('user_1', 'account_1')).resolves.toBe(true)

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(accountRepository.deleteByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(credentialService.deleteCredential).toHaveBeenCalledWith('account_1')
  })

  it('deletes credential storage by real account ids after bulk delete succeeds', async () => {
    const { service, accountRepository, credentialService } = createService()

    await expect(service.deleteMany('user_1', ['account_1', 'account_2'])).resolves.toBeUndefined()

    expect(accountRepository.listByUserIdAndIds).toHaveBeenCalledWith('user_1', ['account_1', 'account_2'])
    expect(accountRepository.deleteByUserIdAndIds).toHaveBeenCalledWith('user_1', ['account_1'])
    expect(credentialService.deleteCredential).toHaveBeenCalledTimes(1)
    expect(credentialService.deleteCredential).toHaveBeenCalledWith('account_1')
    expect(credentialService.deleteCredential).not.toHaveBeenCalledWith('account_2')
  })

  it('does not delete credential storage when bulk delete does not remove accounts', async () => {
    const { service, accountRepository, credentialService } = createService()
    accountRepository.deleteByUserIdAndIds.mockResolvedValueOnce(false)

    await expect(service.deleteMany('user_1', ['account_1', 'account_2'])).resolves.toBeUndefined()

    expect(accountRepository.deleteByUserIdAndIds).toHaveBeenCalledWith('user_1', ['account_1'])
    expect(credentialService.deleteCredential).not.toHaveBeenCalled()
  })

  it('returns without deleting accounts or credential storage when no requested account belongs to the user', async () => {
    const { service, accountRepository, credentialService } = createService()
    accountRepository.listByUserIdAndIds.mockResolvedValueOnce([])

    await expect(service.deleteMany('user_1', ['account_2'])).resolves.toBeUndefined()

    expect(accountRepository.listByUserIdAndIds).toHaveBeenCalledWith('user_1', ['account_2'])
    expect(accountRepository.deleteByUserIdAndIds).not.toHaveBeenCalled()
    expect(credentialService.deleteCredential).not.toHaveBeenCalled()
  })

  it('uses upstream account fields for relay accounts while keeping the local account id', async () => {
    const relayClientService = {
      enabled: true,
      get: vi.fn(async () => ({
        list: [{
          id: 'relay_account_1',
          userId: 'relay_user',
          type: AccountType.Twitter,
          uid: 'upstream_uid',
          nickname: 'Upstream Name',
          avatar: 'https://assets.example.test/upstream.png',
          fansCount: 99,
          status: 1,
        }],
      })),
    }
    const { service } = createService({ relayClientService })
    const accountRepository = {
      getUserAccounts: vi.fn(async () => [{
        _id: 'local_account_1',
        id: 'local_account_1',
        userId: 'user_1',
        type: AccountType.Twitter,
        uid: 'local_uid',
        nickname: 'Stale Name',
        groupId: 'group_1',
        relayAccountRef: 'relay_account_1',
        status: 0,
      }]),
    }
    Reflect.set(service, 'accountRepository', accountRepository)

    const result = await service.list('user_1', {})

    expect(relayClientService.get).toHaveBeenCalledWith('/v2/channels/accounts', {
      ids: ['relay_account_1'],
    })
    expect(result.list).toEqual([expect.objectContaining({
      id: 'local_account_1',
      _id: 'local_account_1',
      userId: 'user_1',
      groupId: 'group_1',
      relayAccountRef: 'relay_account_1',
      uid: 'upstream_uid',
      nickname: 'Upstream Name',
      avatar: 'https://assets.example.test/upstream.png',
      fansCount: 99,
      status: 1,
    })])
  })

  it('marks unavailable relay accounts while preserving local account fields', async () => {
    const { service } = createService()
    const accountRepository = {
      getUserAccounts: vi.fn(async () => [{
        _id: 'local_account_1',
        id: 'local_account_1',
        userId: 'user_1',
        type: AccountType.Twitter,
        uid: 'local_uid',
        nickname: 'Stale Name',
        avatar: 'https://assets.example.test/stale.png',
        groupId: 'group_1',
        relayAccountRef: 'relay_account_1',
        status: 1,
      }]),
    }
    Reflect.set(service, 'accountRepository', accountRepository)

    const result = await service.list('user_1', {})

    expect(result.list).toEqual([expect.objectContaining({
      id: 'local_account_1',
      userId: 'user_1',
      type: AccountType.Twitter,
      uid: 'local_uid',
      nickname: 'relay_account_1',
      avatar: 'https://assets.example.test/stale.png',
      groupId: 'group_1',
      relayAccountRef: 'relay_account_1',
      status: 0,
    })])
  })

  it('stores relay accounts as local ownership refs instead of upstream display data', async () => {
    const { service, accountRepository, accountGroupRepository, eventStream } = createService()

    await service.createRelayAccount('user_1', {
      type: AccountType.Twitter,
      uid: 'platform_uid',
      nickname: 'Upstream Name',
      avatar: 'https://assets.example.test/upstream.png',
      relayAccountRef: 'relay_account_1',
      groupId: 'group_custom',
    })

    expect(accountGroupRepository.getAccountGorupListByIds).toHaveBeenCalledWith(['group_custom'], 'user_1')
    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      { type: AccountType.Twitter, uid: 'platform_uid' },
      expect.objectContaining({
        userId: 'user_1',
        type: AccountType.Twitter,
        uid: 'platform_uid',
        nickname: 'relay_account_1',
        groupId: 'group_custom',
        relayAccountRef: 'relay_account_1',
      }),
    )
    expect(accountRepository.createByIdentity).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({
        avatar: 'https://assets.example.test/upstream.png',
      }),
    )
    expect(eventStream.emit).toHaveBeenCalledWith(
      EventStream.Channels,
      EventTopic.ChannelsAccountConnected,
      {
        userId: 'user_1',
        accountId: 'account_1',
        platform: AccountType.Twitter,
      },
      { source: 'account-service' },
    )
  })

  it('rejects relay account creation when the platform account belongs to another user', async () => {
    const { service, accountRepository, eventStream } = createService()
    accountRepository.getByIdentity.mockResolvedValueOnce({
      id: 'account_2',
      userId: 'user_2',
      type: AccountType.Twitter,
      uid: 'platform_uid',
    })

    await expect(service.createRelayAccount('user_1', {
      type: AccountType.Twitter,
      uid: 'platform_uid',
      nickname: 'Upstream Name',
      relayAccountRef: 'relay_account_1',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelAccountAlreadyConnectedToAnotherUser,
    })
    expect(accountRepository.createByIdentity).not.toHaveBeenCalled()
    expect(accountRepository.updateByIdentity).not.toHaveBeenCalled()
    expect(eventStream.emit).not.toHaveBeenCalled()
  })
})
