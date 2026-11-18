import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShortLinkService } from './short-link.service'

vi.mock('../../config', () => ({
  config: { channel: { shortLink: { baseUrl: 'https://short.example/' } } },
}))

describe('shortLinkService', () => {
  const saveShortLink = vi.fn()
  let service: ShortLinkService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ShortLinkService({ saveShortLink } as never)
  })

  it('retries when a generated code already exists', async () => {
    saveShortLink.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const url = await service.create('https://destination.example')

    expect(url).toMatch(/^https:\/\/short\.example\/[A-Za-z0-9]{8}$/)
    expect(saveShortLink).toHaveBeenCalledTimes(2)
    expect(saveShortLink).toHaveBeenLastCalledWith(url.split('/').at(-1), 'https://destination.example')
  })

  it('fails rather than returning a code it could not reserve', async () => {
    saveShortLink.mockResolvedValue(false)

    await expect(service.create('https://destination.example')).rejects.toThrow('Failed to create short link')
    expect(saveShortLink).toHaveBeenCalledTimes(5)
  })
})
