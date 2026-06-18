import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { WeChatOfficialAuthProvider } from './wechat-official-auth.provider'

function createProvider() {
  const wechatService = {
    generateOfficialAuthUrl: vi.fn(),
    exchangeOfficialCode: vi.fn(),
    refreshOfficialToken: vi.fn(),
    getOfficialUserInfo: vi.fn(async () => ({
      openId: 'wechat-openid',
      nickname: 'WeChat User',
      avatarUrl: 'https://assets.example.test/wechat.jpg',
      unionId: 'union-id',
    })),
  }
  const provider = new WeChatOfficialAuthProvider(wechatService as never, {
    scopes: ['snsapi_userinfo'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, wechatService }
}

describe('wechat official auth provider', () => {
  it('uses the authorized WeChat user as a single account profile', async () => {
    const { provider, wechatService } = createProvider()

    expect(provider.platform).toBe(AccountType.WeChatOfficial)
    await expect(provider.getProfile({
      accessToken: 'access-token',
      platformUid: 'wechat-openid',
    })).resolves.toEqual({
      platformUid: 'wechat-openid',
      displayName: 'WeChat User',
      avatarUrl: 'https://assets.example.test/wechat.jpg',
      raw: {
        unionId: 'union-id',
      },
    })
    expect(wechatService.getOfficialUserInfo).toHaveBeenCalledWith('access-token', 'wechat-openid')
    expect('listSelectableAccounts' in provider).toBe(false)
  })
})
