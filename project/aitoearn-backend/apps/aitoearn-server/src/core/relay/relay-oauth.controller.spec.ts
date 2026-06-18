import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { RelayOAuthController } from './relay-oauth.controller'

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
  Account: class Account {},
  AccountRepository: class AccountRepository {},
  AccountStatus: {
    NORMAL: 1,
  },
}))

vi.mock('../channels/accounts/account.service', () => ({
  AccountService: class AccountService {},
}))

function createController() {
  const accountService = {
    createRelayAccount: vi.fn(async (_userId: string, data: { uid: string }) => ({
      id: `account-${data.uid}`,
    })),
  }
  const redisService = {
    saveLegacyRelayAuthTask: vi.fn(async () => undefined),
  }

  return {
    controller: new RelayOAuthController(accountService as never, redisService as never),
    accountService,
    redisService,
  }
}

describe('relay oauth controller', () => {
  it('creates a relay account and renders the new callback view data with body redirect uri', async () => {
    const { controller, accountService } = createController()

    const result = await controller.handleRelayCallback({
      relayAccountRef: 'relay-account-1',
      nickname: 'Relay User',
      avatar: 'https://cdn.example.test/avatar.png',
      platformUid: 'platform-user',
      platform: AccountType.Twitter,
      redirectUri: 'https://client.example.test/redirect',
    } as never, 'user-1')

    expect(accountService.createRelayAccount).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        type: AccountType.Twitter,
        uid: 'platform-user',
        nickname: 'Relay User',
        relayAccountRef: 'relay-account-1',
      }),
    )
    expect(result).toEqual({
      status: 1,
      message: '授权成功',
      accountId: 'account-platform-user',
      accountIds: ['account-platform-user'],
      redirectUri: 'https://client.example.test/redirect',
    })
  })

  it('uses platform fields from multi-account payloads', async () => {
    const { controller, accountService } = createController()

    await controller.handleRelayCallback({
      relayAccountRef: 'fallback-relay-account',
      nickname: 'Fallback User',
      platformUid: 'fallback-user',
      platform: AccountType.Twitter,
      accounts: JSON.stringify([
        {
          relayAccountRef: 'relay-account-1',
          nickname: 'Relay User One',
          platformUid: 'platform-user-1',
          platform: AccountType.Twitter,
        },
        {
          relayAccountRef: 'relay-account-2',
          nickname: 'Relay User Two',
          platformUid: 'platform-user-2',
          platform: AccountType.Facebook,
        },
      ]),
    } as never, 'user-1')

    expect(accountService.createRelayAccount).toHaveBeenCalledTimes(2)
    expect(accountService.createRelayAccount).toHaveBeenNthCalledWith(
      1,
      'user-1',
      expect.objectContaining({
        type: AccountType.Twitter,
        uid: 'platform-user-1',
        relayAccountRef: 'relay-account-1',
      }),
    )
    expect(accountService.createRelayAccount).toHaveBeenNthCalledWith(
      2,
      'user-1',
      expect.objectContaining({
        type: AccountType.Facebook,
        uid: 'platform-user-2',
        relayAccountRef: 'relay-account-2',
      }),
    )
  })
})
