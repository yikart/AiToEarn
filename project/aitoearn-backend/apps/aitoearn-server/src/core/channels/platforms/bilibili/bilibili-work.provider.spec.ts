import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BilibiliWorkProvider } from './bilibili-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

const axiosGet = vi.mocked(axios.get)

function createRedirectResponse(responseUrl: string, requestUrl = 'https://b23.tv/abc123') {
  return {
    request: {
      res: {
        responseUrl,
      },
    },
    config: {
      url: requestUrl,
    },
  }
}

describe('bilibili work provider link info', () => {
  beforeEach(() => {
    axiosGet.mockReset()
  })

  it.each([
    ['https://www.bilibili.com/video/BV1xx411c7mD?spm_id_from=333.788', 'BV1xx411c7mD'],
    ['https://m.bilibili.com/video/BV1yy411c7mE', 'BV1yy411c7mE'],
    ['https://www.bilibili.com/video/av170001', 'av170001'],
  ])('parses Bilibili video id from %s', async (link, expectedId) => {
    const provider = new BilibiliWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Bilibili,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: `https://www.bilibili.com/video/${expectedId}`,
      },
      extra: {
        dataId: expectedId,
        uniqueId: `${AccountType.Bilibili}_${expectedId}`,
        resolvedUrl: `https://www.bilibili.com/video/${expectedId}`,
      },
    })
  })

  it('resolves b23 short links before parsing video id', async () => {
    const provider = new BilibiliWorkProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://www.bilibili.com/video/BV1zz411c7mF?from=short'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Bilibili,
      link: 'https://b23.tv/abc123',
    })).resolves.toMatchObject({
      work: {
        id: 'BV1zz411c7mF',
        url: 'https://www.bilibili.com/video/BV1zz411c7mF',
      },
      extra: {
        dataId: 'BV1zz411c7mF',
        resolvedUrl: 'https://www.bilibili.com/video/BV1zz411c7mF',
      },
      rawResponse: {
        resolvedUrl: 'https://www.bilibili.com/video/BV1zz411c7mF?from=short',
      },
    })

    expect(axiosGet).toHaveBeenCalledWith(
      'https://b23.tv/abc123',
      expect.objectContaining({
        maxRedirects: 5,
        timeout: 10000,
      }),
    )
  })

  it('rejects short links when redirect resolution fails', async () => {
    const provider = new BilibiliWorkProvider()
    axiosGet.mockRejectedValue(new Error('network failed'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Bilibili,
      link: 'https://b23.tv/abc123',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('does not fall back to input dataId when the link is invalid', async () => {
    const provider = new BilibiliWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Bilibili,
      link: 'https://example.com/video/BV1xx411c7mD',
      dataId: 'BV1xx411c7mD',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
