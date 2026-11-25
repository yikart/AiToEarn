import type { AssetsService } from '@yikart/assets'
import type { AiLogRepository } from '@yikart/mongodb'
import { UserType } from '@yikart/common'
import axios from 'axios'
import { vi } from 'vitest'
import { ImageService } from './image.service'
import { MiniMaxImageModel } from './minimax-image.config'

describe('miniMax image generation', () => {
  const endpoint = 'https://api.minimax.cn/v1/images/generations' as const
  const uploadFromBuffer = vi.fn()
  const updateById = vi.fn()
  let service: ImageService

  beforeEach(() => {
    vi.restoreAllMocks()
    uploadFromBuffer.mockReset().mockResolvedValue({ asset: { path: 'saved.png' } })
    updateById.mockReset()
    service = new ImageService(
      { uploadFromBuffer } as unknown as AssetsService,
      undefined!,
      undefined!,
      { create: vi.fn().mockResolvedValue({ id: 'log' }), updateById } as unknown as AiLogRepository,
      undefined!,
      undefined!,
      undefined,
      { apiKey: 'example', endpoint },
    )
  })

  it('stores the decoded image and returns its usage', async () => {
    const usage = { total_tokens: 10 }
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { data: [{ b64_json: 'YWJj' }], usage } })
    const model = MiniMaxImageModel.Highspeed
    const result = await service.userMiniMaxImageGeneration('user', UserType.User, model, 'landscape', '16:9')

    expect(post).toHaveBeenCalledWith(endpoint, {
      model,
      prompt: 'landscape',
      aspect_ratio: '16:9',
      response_format: 'b64_json',
      output_format: 'png',
    }, {
      headers: { Authorization: 'Bearer example' },
      timeout: 600_000,
      maxRedirects: 0,
    })
    expect(uploadFromBuffer).toHaveBeenCalledWith('user', Buffer.from('abc'), expect.objectContaining({ mimeType: 'image/png' }), model)
    expect(result).toEqual({ images: [{ url: 'saved.png' }], usage })
  })

  it('does not submit a second request after a network failure', async () => {
    const post = vi.spyOn(axios, 'post').mockRejectedValue(new Error('Connection closed'))
    await expect(service.userMiniMaxImageGeneration('user', UserType.User, MiniMaxImageModel.Standard, 'landscape'))
      .rejects
      .toThrow('MiniMax image generation failed')
    expect(post).toHaveBeenCalledTimes(1)
    expect(uploadFromBuffer).not.toHaveBeenCalled()
  })
})
