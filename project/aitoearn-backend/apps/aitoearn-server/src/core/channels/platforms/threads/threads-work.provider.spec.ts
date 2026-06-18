import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { ThreadsWorkProvider } from './threads-work.provider'
import { ThreadsService } from './threads.service'

function createProvider() {
  return new ThreadsWorkProvider({} as ThreadsService)
}

describe('threads work provider link info', () => {
  it.each([
    [
      'https://www.threads.net/@alice/post/post-1?from=share#fragment',
      'post-1',
      'https://www.threads.com/@alice/post/post-1',
    ],
    [
      'https://threads.com/@alice/post/post-2/media',
      'post-2',
      'https://www.threads.com/@alice/post/post-2',
    ],
    [
      'https://www.threads.net/t/post-3/media?x=1',
      'post-3',
      'https://www.threads.com/t/post-3',
    ],
  ])('parses Threads post id from %s', async (link, expectedId, expectedUrl) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Threads,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: expectedUrl,
      },
    })
  })

  it.each([
    'https://example.com/@alice/post/post-1',
    'https://www.threads.com/alice/post/post-1',
    'https://www.threads.com/@alice/other/post-1',
    'not a url',
  ])('rejects invalid Threads links for %s', async (link) => {
    const provider = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Threads,
      link,
      dataId: 'post-1',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
