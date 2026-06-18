import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { TikTokWorkProvider } from './tiktok-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('./tiktok.service', () => ({
  TikTokService: class TikTokService {},
}))

function createProvider() {
  return new TikTokWorkProvider({} as never)
}

describe('tiktok work provider link info', () => {
  it.each([
    ['https://www.tiktok.com/@creator/video/7602997517160123666?lang=en', '7602997517160123666', 'video', 'https://www.tiktok.com/@creator/video/7602997517160123666'],
    ['https://www.tiktok.com/@creator/photo/7602997517160123667', '7602997517160123667', 'photo', 'https://www.tiktok.com/@creator/photo/7602997517160123667'],
  ])('parses canonical work links for %s', async (link, id, mediaType, canonicalUrl) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.TikTok,
      link,
    })).resolves.toMatchObject({
      work: {
        id,
        url: canonicalUrl,
        mediaType,
      },
      extra: {
        resolvedUrl: link,
      },
    })
  })

  it.each([
    'https://vm.tiktok.com/ZMh1AbCdE/',
    'https://vt.tiktok.com/ZMh1AbCdE/',
  ])('resolves TikTok short links before parsing %s', async (link) => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      request: {
        res: {
          responseUrl: 'https://www.tiktok.com/@creator/video/7602997517160123666',
        },
      },
      config: { url: link },
    })
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.TikTok,
      link,
    })).resolves.toMatchObject({
      work: {
        id: '7602997517160123666',
        url: 'https://www.tiktok.com/@creator/video/7602997517160123666',
        mediaType: 'video',
      },
      extra: {
        resolvedUrl: 'https://www.tiktok.com/@creator/video/7602997517160123666',
      },
    })
  })

  it.each([
    'https://example.com/@creator/video/7602997517160123666',
    'https://www.tiktok.com/@creator/live/7602997517160123666',
    'not a url',
  ])('rejects invalid links for %s', async (link) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.TikTok,
      link,
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('rejects short links that cannot be resolved', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('network unavailable'))
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.TikTok,
      link: 'https://vm.tiktok.com/ZMh1AbCdE/',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
