import { Test } from '@nestjs/testing'
import { ASSETS_CONFIG, type AssetsConfig } from '@yikart/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RelayConfig } from '../libs/relay/relay.config'
import { RelayMediaResolverService } from './relay-media-resolver.service'

const axiosMock = vi.hoisted(() => ({
  create: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create,
    get: axiosMock.get,
    put: axiosMock.put,
  },
}))

vi.mock('@yikart/assets', () => ({
  ASSETS_CONFIG: Symbol('ASSETS_CONFIG'),
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    Temp: 'temp',
  },
}))

describe('relayMediaResolverService', () => {
  const assetsConfig = {
    provider: 's3',
    endpoint: 'https://storage.local',
    cdnEndpoint: 'https://cdn.local',
    bucketName: 'bucket',
  } as AssetsConfig

  beforeEach(() => {
    vi.clearAllMocks()
    axiosMock.create.mockReturnValue({ post: axiosMock.post })
  })

  async function createService(config?: RelayConfig) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RelayConfig,
          useValue: config,
        },
        {
          provide: ASSETS_CONFIG,
          useValue: assetsConfig,
        },
        RelayMediaResolverService,
      ],
    }).compile()
    return moduleRef.get(RelayMediaResolverService)
  }

  it('keeps text unchanged when relay is not configured', async () => {
    const service = await createService()

    await expect(service.resolveText('https://cdn.local/user/media/cat.png')).resolves.toBe('https://cdn.local/user/media/cat.png')
    expect(axiosMock.get).not.toHaveBeenCalled()
    expect(axiosMock.post).not.toHaveBeenCalled()
  })

  it('uploads each matched local asset url once and replaces every occurrence', async () => {
    const service = await createService({ url: 'https://relay.example.com', apiKey: 'relay-key', timeout: 1000 } as RelayConfig)
    axiosMock.get.mockResolvedValue({
      data: Buffer.from('image-bytes'),
      headers: {
        'content-type': 'image/png',
      },
    })
    axiosMock.post
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'asset-1',
            url: 'https://relay.example.com/assets/cat.png',
            uploadUrl: 'https://upload.example.com/cat.png',
          },
        },
      })
      .mockResolvedValueOnce({ data: { data: {} } })
    axiosMock.put.mockResolvedValueOnce({ status: 200 })

    const localUrl = 'https://cdn.local/user/media/cat.png?x=1'
    const text = `image=${localUrl} again=${localUrl} bare=user/media/cat.png external=https://external.example.com/a.png`

    await expect(service.resolveText(text)).resolves.toBe(
      'image=https://relay.example.com/assets/cat.png again=https://relay.example.com/assets/cat.png bare=user/media/cat.png external=https://external.example.com/a.png',
    )

    expect(axiosMock.get).toHaveBeenCalledTimes(1)
    expect(axiosMock.get).toHaveBeenCalledWith(
      'https://storage.local/bucket/user/media/cat.png?x=1',
      { responseType: 'arraybuffer' },
    )
    expect(axiosMock.post).toHaveBeenCalledTimes(2)
    expect(axiosMock.post).toHaveBeenNthCalledWith(1, '/api/assets/uploadSign', {
      filename: 'cat.png',
      type: 'temp',
      size: Buffer.from('image-bytes').byteLength,
    })
    expect(axiosMock.put).toHaveBeenCalledTimes(1)
    expect(axiosMock.put).toHaveBeenCalledWith(
      'https://upload.example.com/cat.png',
      Buffer.from('image-bytes'),
      expect.objectContaining({
        headers: { 'Content-Type': 'image/png' },
      }),
    )
  })

  it('keeps unmatched external urls and bare paths unchanged', async () => {
    const service = await createService({ url: 'https://relay.example.com', apiKey: 'relay-key', timeout: 1000 } as RelayConfig)

    const text = 'external=https://external.example.com/a.png bare=user/media/cat.png'

    await expect(service.resolveText(text)).resolves.toBe(text)
    expect(axiosMock.get).not.toHaveBeenCalled()
    expect(axiosMock.post).not.toHaveBeenCalled()
  })
})
