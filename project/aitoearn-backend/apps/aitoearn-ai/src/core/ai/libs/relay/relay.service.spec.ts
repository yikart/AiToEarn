import type { AiAvailabilityService } from '../../../ai-availability'
import { vi } from 'vitest'
import { RelayConfig } from './relay.config'
import { RelayLibService } from './relay.service'

describe('relayLibService', () => {
  let service: RelayLibService
  let httpClient: {
    post: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    service = new RelayLibService(
      { url: 'https://relay.example.com', apiKey: 'relay-key', timeout: 1000 } as RelayConfig,
      { execute: vi.fn((_context, fn) => fn()) } as unknown as AiAvailabilityService,
    )
    httpClient = {
      post: vi.fn(),
      get: vi.fn(),
    }
    Object.assign(service as unknown as { httpClient: typeof httpClient }, { httpClient })
  })

  it('unwraps common response data when creating relay video tasks', async () => {
    httpClient.post.mockResolvedValue({
      data: {
        code: 0,
        message: 'ok',
        data: { id: 'remote-task-1', status: 'generating' },
      },
    })

    await expect(service.createVideo({
      model: 'relay-video-model',
      prompt: 'video',
    })).resolves.toEqual({ id: 'remote-task-1', status: 'generating' })
  })

  it('unwraps common response data when polling relay video tasks', async () => {
    httpClient.get.mockResolvedValue({
      data: {
        code: 0,
        message: 'ok',
        data: { id: 'remote-task-1', status: 'success', videoUrl: 'videos/out.mp4' },
      },
    })

    await expect(service.getVideo('remote-task-1')).resolves.toEqual({
      id: 'remote-task-1',
      status: 'success',
      videoUrl: 'videos/out.mp4',
    })
  })
})
