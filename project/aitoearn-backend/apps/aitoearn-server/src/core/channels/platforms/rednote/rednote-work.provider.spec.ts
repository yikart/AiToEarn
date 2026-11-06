import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RedNoteWorkProvider } from './rednote-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('@yikart/mongodb', () => ({
  PublishType: {
    VIDEO: 'video',
  },
}))

const axiosGet = vi.mocked(axios.get)

function createRedirectResponse(responseUrl: string, requestUrl = 'https://xhslink.com/abc123') {
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

describe('rednote work provider link info', () => {
  beforeEach(() => {
    axiosGet.mockReset()
  })

  it.each([
    ['https://www.rednote.com/explore/note_1', 'note_1', 'https://www.rednote.com/explore/note_1'],
    ['https://rednote.com/discovery/item/note_2', 'note_2', 'https://rednote.com/discovery/item/note_2'],
    ['https://www.rednote.com/red_video/note_3', 'note_3', 'https://www.rednote.com/red_video/note_3'],
    ['https://www.rednote.com/user/profile/user_1/note_4', 'note_4', 'https://www.rednote.com/user/profile/user_1/note_4'],
    ['https://www.xiaohongshu.com/explore/note_5', 'note_5', 'https://www.xiaohongshu.com/explore/note_5'],
  ])('parses RedNote work id from %s', async (link, expectedId, expectedUrl) => {
    const provider = new RedNoteWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.RedNote,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: expectedUrl,
      },
      extra: {
        dataId: expectedId,
        uniqueId: `${AccountType.RedNote}_${expectedId}`,
        resolvedUrl: expectedUrl,
      },
    })
  })

  it('extracts xsec_token from rednote.com links', async () => {
    const provider = new RedNoteWorkProvider()

    await expect(provider.getWorkLinkInfo('https://www.rednote.com/explore/note_1?xsec_token=token_1&xsec_source=pc_share'))
      .resolves
      .toMatchObject({
        extra: {
          dataId: 'note_1',
        },
        rawResponse: {
          noteId: 'note_1',
          xsecToken: 'token_1',
        },
      })
  })

  it('resolves xhslink.com short links that redirect to rednote.com', async () => {
    const provider = new RedNoteWorkProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://www.rednote.com/explore/note_6?xsec_token=token_6'))

    await expect(provider.getLinkInfo({
      platform: AccountType.RedNote,
      link: 'https://xhslink.com/abc123',
    })).resolves.toMatchObject({
      work: {
        id: 'note_6',
        url: 'https://www.rednote.com/explore/note_6?xsec_token=token_6',
      },
      extra: {
        dataId: 'note_6',
        originalWorkLink: 'https://xhslink.com/abc123',
      },
      rawResponse: {
        noteId: 'note_6',
        xsecToken: 'token_6',
      },
    })

    expect(axiosGet).toHaveBeenCalledWith(
      'https://xhslink.com/abc123',
      expect.objectContaining({
        maxRedirects: 5,
        timeout: 10000,
      }),
    )
  })

  it('rejects short links when the redirect target is not a RedNote domain', async () => {
    const provider = new RedNoteWorkProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://example.com/explore/note_7'))

    await expect(provider.getLinkInfo({
      platform: AccountType.RedNote,
      link: 'https://xhslink.com/abc123',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('rejects unsupported domains without a dataId fallback', async () => {
    const provider = new RedNoteWorkProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.RedNote,
      link: 'https://example.com/explore/note_8',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
