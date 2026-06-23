import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DouyinWorkProvider } from './douyin-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

const axiosGet = vi.mocked(axios.get)

function createRedirectResponse(responseUrl: string, requestUrl = 'https://v.douyin.com/abc123') {
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

describe('douyin work provider link info', () => {
  beforeEach(() => {
    axiosGet.mockReset()
  })

  it.each([
    ['https://www.douyin.com/video/7380000000000000000?previous_page=web_code_link', '7380000000000000000', 'https://www.douyin.com/video/7380000000000000000'],
    ['https://www.douyin.com/note/7390000000000000000', '7390000000000000000', 'https://www.douyin.com/note/7390000000000000000'],
    ['https://www.douyin.com/user/self?modal_id=7400000000000000000', '7400000000000000000', 'https://www.douyin.com/video/7400000000000000000'],
    ['https://www.iesdouyin.com/share/video/7410000000000000000/?region=CN', '7410000000000000000', 'https://www.douyin.com/video/7410000000000000000'],
  ])('parses Douyin work id from %s', async (link, expectedId, expectedUrl) => {
    const provider = new DouyinWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Douyin,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: expectedUrl,
      },
      extra: {
        dataId: expectedId,
        uniqueId: `${AccountType.Douyin}_${expectedId}`,
        resolvedUrl: expectedUrl,
      },
    })
  })

  it('resolves Douyin short links before parsing work id', async () => {
    const provider = new DouyinWorkProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://www.douyin.com/video/7420000000000000000?from=short'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Douyin,
      link: 'https://v.douyin.com/abc123',
    })).resolves.toMatchObject({
      work: {
        id: '7420000000000000000',
        url: 'https://www.douyin.com/video/7420000000000000000',
      },
      extra: {
        dataId: '7420000000000000000',
        resolvedUrl: 'https://www.douyin.com/video/7420000000000000000',
      },
      rawResponse: {
        resolvedUrl: 'https://www.douyin.com/video/7420000000000000000?from=short',
      },
    })

    expect(axiosGet).toHaveBeenCalledWith(
      'https://v.douyin.com/abc123',
      expect.objectContaining({
        maxRedirects: 5,
        timeout: 10000,
      }),
    )
  })

  it('rejects short links when redirect resolution fails', async () => {
    const provider = new DouyinWorkProvider()
    axiosGet.mockRejectedValue(new Error('network failed'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Douyin,
      link: 'https://v.douyin.com/abc123',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('does not fall back to input dataId when the link is invalid', async () => {
    const provider = new DouyinWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Douyin,
      link: 'https://example.com/video/7430000000000000000',
      dataId: '7430000000000000000',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
