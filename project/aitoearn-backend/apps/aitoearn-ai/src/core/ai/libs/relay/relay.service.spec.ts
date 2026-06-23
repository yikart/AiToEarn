import type { AiAvailabilityService } from '../../../ai-availability'
import { AppException, ResponseCode } from '@yikart/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RelayConfig } from './relay.config'
import { RelayLibService } from './relay.service'

vi.mock('../../../ai-availability', () => ({
  AiAvailabilityService: class AiAvailabilityService {},
}))

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

  function normalizeResponse(data: unknown) {
    return (service as unknown as {
      normalizeResponse: (response: { data: unknown }) => { data: unknown }
    }).normalizeResponse({ data }).data
  }

  it('returns relay video task response when creating relay video tasks', async () => {
    httpClient.post.mockResolvedValue({
      data: { id: 'remote-task-1', status: 'generating' },
    })

    await expect(service.createVideo({
      model: 'relay-video-model',
      prompt: 'video',
    })).resolves.toEqual({ id: 'remote-task-1', status: 'generating' })
  })

  it('unwraps common and legacy data-only responses in response interceptor', () => {
    expect(normalizeResponse({
      code: ResponseCode.Success,
      message: 'ok',
      data: { id: 'remote-task-1', status: 'generating' },
    })).toEqual({ id: 'remote-task-1', status: 'generating' })
    expect(normalizeResponse({
      data: {
        id: 'remote-task-2',
        status: 'generating',
      },
    })).toEqual({ id: 'remote-task-2', status: 'generating' })
  })

  it('returns relay video task status when polling relay video tasks', async () => {
    httpClient.get.mockResolvedValue({
      data: { id: 'remote-task-1', status: 'success', videoUrl: 'videos/out.mp4' },
    })

    await expect(service.getVideo('remote-task-1')).resolves.toEqual({
      id: 'remote-task-1',
      status: 'success',
      videoUrl: 'videos/out.mp4',
    })
  })

  it('throws AppException with original response code when common response code is not success', () => {
    expect(() => normalizeResponse({
      code: ResponseCode.InvalidModel,
      message: 'upstream rejected image url',
      data: null,
    })).toThrow(AppException)

    try {
      normalizeResponse({
        code: ResponseCode.InvalidModel,
        message: 'upstream rejected image url',
        data: null,
      })
    }
    catch (error) {
      expect(error).toBeInstanceOf(AppException)
      expect((error as AppException).code).toBe(ResponseCode.InvalidModel)
    }
  })

  it('throws AiCallFailed when relay video submit response has no id', async () => {
    httpClient.post.mockResolvedValue({
      data: { status: 'failed', error: 'invalid image url' },
    })

    await expect(service.createVideo({
      model: 'relay-video-model',
      prompt: 'video',
    })).rejects.toMatchObject({ code: ResponseCode.AiCallFailed })
  })
})
