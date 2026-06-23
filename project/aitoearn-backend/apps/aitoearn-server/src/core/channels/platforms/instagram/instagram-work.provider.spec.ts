import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { PublishContentMode } from '../platforms.interface'
import { InstagramWorkProvider } from './instagram-work.provider'
import { InstagramService } from './instagram.service'

function createProvider() {
  return new InstagramWorkProvider({} as InstagramService)
}

describe('instagram work provider link info', () => {
  it('maps legacy VIDEO media_type from Graph reads to video content mode', async () => {
    const provider = new InstagramWorkProvider({
      listWorks: async () => ({
        data: [{
          id: 'media-1',
          media_type: 'VIDEO',
          permalink: 'https://www.instagram.com/p/media-shortcode/',
        }],
      }),
    } as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Instagram,
      credential: {
        accessToken: 'access-token',
        platformUid: 'ig-user-id',
      },
      pagination: {},
    })).resolves.toMatchObject({
      items: [{
        platformWorkId: 'media-1',
        contentMode: PublishContentMode.Video,
      }],
    })
  })

  it.each([
    'https://www.instagram.com/p/shortcode-1/',
    'https://www.instagram.com/reel/shortcode-2/?igsh=abc',
    'https://www.instagram.com/reels/shortcode-3/',
    'https://instagram.com/tv/shortcode-4/',
  ])('keeps Graph media id as final work id for %s', async (link) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      link,
      dataId: 'graph-media-id',
    })).resolves.toMatchObject({
      work: {
        id: 'graph-media-id',
        url: link,
      },
      extra: {
        dataId: 'graph-media-id',
        resolvedUrl: link,
      },
    })
  })

  it('does not use shortcode as final id when dataId is absent', async () => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Instagram,
      link: 'https://www.instagram.com/p/shortcode-1/',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it.each([
    'https://example.com/p/shortcode-1/',
    'https://www.instagram.com/accounts/login/',
    'not a url',
  ])('rejects invalid links for %s', async (link) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Instagram,
      link,
      dataId: 'graph-media-id',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
