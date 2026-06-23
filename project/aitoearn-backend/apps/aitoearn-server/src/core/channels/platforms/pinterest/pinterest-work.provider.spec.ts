import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PinterestWorkProvider } from './pinterest-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('./pinterest.service', () => ({
  PinterestService: class PinterestService {},
}))

const axiosGet = vi.mocked(axios.get)

function createProvider() {
  return new PinterestWorkProvider({} as never)
}

function createRedirectResponse(responseUrl: string, requestUrl = 'https://pin.it/abc123') {
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

describe('pinterest work provider link info', () => {
  beforeEach(() => {
    axiosGet.mockReset()
  })

  it('does not require credentials for link info parsing', () => {
    expect(createProvider().requiresCredentialForLinkInfo).toBe(false)
  })

  it.each([
    ['https://www.pinterest.com/pin/123456789/?utm_source=share', '123456789'],
    ['https://br.pinterest.com/pin/pin-1/', 'pin-1'],
  ])('parses Pinterest pin ids from %s', async (link, expectedId) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Pinterest,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: `https://www.pinterest.com/pin/${expectedId}/`,
      },
      extra: {
        dataId: expectedId,
        uniqueId: `${AccountType.Pinterest}_${expectedId}`,
        resolvedUrl: link,
      },
    })
  })

  it('resolves pin.it short links before parsing the pin id', async () => {
    const provider = createProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://www.pinterest.com/pin/987654321/?share=true'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Pinterest,
      link: 'https://pin.it/abc123',
    })).resolves.toMatchObject({
      work: {
        id: '987654321',
        url: 'https://www.pinterest.com/pin/987654321/',
      },
      extra: {
        dataId: '987654321',
        uniqueId: `${AccountType.Pinterest}_987654321`,
        resolvedUrl: 'https://www.pinterest.com/pin/987654321/?share=true',
      },
      rawResponse: {
        resolvedUrl: 'https://www.pinterest.com/pin/987654321/?share=true',
      },
    })

    expect(axiosGet).toHaveBeenCalledWith(
      'https://pin.it/abc123',
      expect.objectContaining({
        maxRedirects: 5,
        timeout: 10000,
      }),
    )
  })

  it.each([
    'https://example.com/pin/123456789',
    'https://www.pinterest.com/not-pin/123456789',
    'not a url',
  ])('rejects invalid Pinterest work links for %s', async (link) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Pinterest,
      link,
      dataId: '123456789',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('rejects pin.it short links when redirect resolution fails', async () => {
    const provider = createProvider()
    axiosGet.mockRejectedValue(new Error('network unavailable'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Pinterest,
      link: 'https://pin.it/abc123',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
