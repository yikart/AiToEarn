import { describe, expect, it, vi } from 'vitest'
import { PlatformStatus } from '../platforms.interface'
import { WeChatMsgCryptoService } from './wechat-msg-crypto.service'
import { WechatModule } from './wechat.module'

vi.mock('../platforms.registry.module', () => ({
  PlatformRegistryModule: class PlatformRegistryModule {},
}))

vi.mock('@yikart/mongodb', () => ({
  AccountGroupRepository: class AccountGroupRepository {},
  AccountRepository: class AccountRepository {},
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
  PublishRecordRepository: class PublishRecordRepository {},
}))

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

describe('wechat module', () => {
  it('does not register message crypto service in the root module without channels config provider', () => {
    const module = WechatModule.forRoot({
      official: {
        status: PlatformStatus.ComingSoon,
        logoUrl: 'https://assets.aitoearn.ai/platforms/wechat-official.svg',
      },
      channels: {
        status: PlatformStatus.Available,
        appId: 'app_id',
        appSecret: 'app_secret',
        token: 'token',
        encodingAESKey: 'WGUa1GctNW8E5dw4kEWsUUoJ6Wh6qRAx6dWduuMlrvi',
        redirectUri: 'https://api.example.test/wechat/channels/callback',
        logoUrl: 'https://assets.aitoearn.ai/platforms/wechat-channels.svg',
      },
    } as never)

    expect(module.providers).not.toContain(WeChatMsgCryptoService)
    expect(module.exports).not.toContain(WeChatMsgCryptoService)
  })
})
