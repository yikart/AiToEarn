import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { WeChatChannelsWorkProvider } from './wechat-channels-work.provider'

describe('weChat Channels work provider', () => {
  it('parses WeChat Channels short links', async () => {
    const wechatService = {
      channelsGetLinkInfo: vi.fn(async () => ({
        finder_id: 'finder-A',
        video_id: 'video-1',
      })),
    }
    const provider = new WeChatChannelsWorkProvider(wechatService as never)

    await expect(provider.getLinkInfo({
      accountId: 'wxSph_account-1',
      platform: AccountType.WeChatChannels,
      link: 'https://weixin.qq.com/sph/ADC2GC9he',
    })).resolves.toMatchObject({
      work: {
        id: 'finder-A:video-1',
        url: 'https://weixin.qq.com/sph/ADC2GC9he',
      },
    })

    expect(wechatService.channelsGetLinkInfo).toHaveBeenCalledWith('https://weixin.qq.com/sph/ADC2GC9he')
  })

  it('uses provided work id without requesting WeChat OpenAPI', async () => {
    const wechatService = {
      channelsGetLinkInfo: vi.fn(),
    }
    const provider = new WeChatChannelsWorkProvider(wechatService as never)

    await expect(provider.getLinkInfo({
      accountId: 'wxSph_account-1',
      platform: AccountType.WeChatChannels,
      link: 'https://weixin.qq.com/sph/ADC2GC9he',
      dataId: 'export/UzFfBgAAxJyAcFFDDF7OjMzT4DCaItKwOAEsNXONanqFkTkoAKwoEryu8w',
    })).resolves.toMatchObject({
      work: {
        id: 'export/UzFfBgAAxJyAcFFDDF7OjMzT4DCaItKwOAEsNXONanqFkTkoAKwoEryu8w',
        url: 'https://weixin.qq.com/sph/ADC2GC9he',
      },
      extra: {
        dataId: 'export/UzFfBgAAxJyAcFFDDF7OjMzT4DCaItKwOAEsNXONanqFkTkoAKwoEryu8w',
        platformWorkId: 'export/UzFfBgAAxJyAcFFDDF7OjMzT4DCaItKwOAEsNXONanqFkTkoAKwoEryu8w',
        resolvedUrl: 'https://weixin.qq.com/sph/ADC2GC9he',
      },
    })

    expect(wechatService.channelsGetLinkInfo).not.toHaveBeenCalled()
  })

  it('rejects non Channels WeChat links', async () => {
    const wechatService = {
      channelsGetLinkInfo: vi.fn(),
    }
    const provider = new WeChatChannelsWorkProvider(wechatService as never)

    await expect(provider.getLinkInfo({
      accountId: 'wxSph_account-1',
      platform: AccountType.WeChatChannels,
      link: 'https://weixin.qq.com/not-sph/ADC2GC9he',
    })).rejects.toMatchObject({ code: 15036 })

    expect(wechatService.channelsGetLinkInfo).not.toHaveBeenCalled()
  })

  it('verifies ownership against the candidate account finder id', async () => {
    const wechatService = {
      channelsGetFinderVideoInfo: vi.fn(async () => ({
        finder_id: 'finder-B',
      })),
    }
    const provider = new WeChatChannelsWorkProvider(wechatService as never)

    await expect(provider.verifyOwnership({
      accountId: 'account-1',
      platform: AccountType.WeChatChannels,
      platformWorkId: 'finder-B:video-1',
      credential: {
        accessToken: 'token',
        platformUid: 'finder-A',
      },
    })).resolves.toBe(false)

    await expect(provider.verifyOwnership({
      accountId: 'account-2',
      platform: AccountType.WeChatChannels,
      platformWorkId: 'finder-B:video-1',
      credential: {
        accessToken: 'token',
        platformUid: 'finder-B',
      },
    })).resolves.toBe(true)
  })
})
