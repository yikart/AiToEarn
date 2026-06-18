import type { AiLog, AiLogRepository } from '@yikart/mongodb'
import type { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import type { RelayLibService } from '../../libs/relay'
import type { ModelsConfigService } from '../../models-config'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { vi } from 'vitest'
import { RelayVideoService } from './relay-video.service'

vi.mock('../../models-config', () => ({ ModelsConfigService: class ModelsConfigService {} }))

describe('relayVideoService', () => {
  let service: RelayVideoService
  let mockRelayLibService: vi.Mocked<Pick<RelayLibService, 'createVideo'>>
  let mockAiLogRepo: vi.Mocked<Pick<AiLogRepository, 'create' | 'getByTaskId' | 'updateByIdAndStatus'>>
  let mockAiAvailability: vi.Mocked<Pick<AiAvailabilityService, 'executeAsync' | 'recordAsyncComplete'>>

  const relayModel = {
    name: 'relay-video-model',
    channel: AiLogChannel.Relay,
    defaults: {
      resolution: '720p',
      aspectRatio: '9:16',
      duration: 5,
    },
    durations: [5],
    aspectRatios: ['9:16', '16:9'],
    maxInputImages: 9,
    modes: ['text2video', 'multi-ref'],
  }

  beforeEach(() => {
    mockRelayLibService = {
      createVideo: vi.fn().mockResolvedValue({ id: 'relay-task-1', status: 'queued' }),
    }
    mockAiLogRepo = {
      create: vi.fn().mockResolvedValue({ id: 'ai-log-1' }),
      getByTaskId: vi.fn(),
      updateByIdAndStatus: vi.fn(),
    }
    mockAiAvailability = {
      executeAsync: vi.fn((_context, execute) => execute()),
      recordAsyncComplete: vi.fn().mockResolvedValue(undefined),
    } as never

    service = new RelayVideoService(
      mockRelayLibService as RelayLibService,
      mockAiLogRepo as AiLogRepository,
      { config: { video: { generation: [relayModel] } } } as unknown as ModelsConfigService,
      mockAiAvailability as AiAvailabilityService,
    )
  })

  it('forwards only original video fields and creates local ai log', async () => {
    await service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'relay-video-model',
      prompt: 'A vertical product video',
    })

    expect(mockRelayLibService.createVideo).toHaveBeenCalledWith(expect.objectContaining({
      model: 'relay-video-model',
      prompt: 'A vertical product video',
    }))

    const payload = mockRelayLibService.createVideo.mock.calls[0][0]
    expect('userId' in payload).toBe(false)
    expect('userType' in payload).toBe(false)
    expect('groupId' in payload).toBe(false)
    expect(payload.ratio).toBeUndefined()
    expect(payload.resolution).toBeUndefined()
    expect(payload.duration).toBeUndefined()

    const createdLog = mockAiLogRepo.create.mock.calls[0][0]
    expect(createdLog).toMatchObject({
      userId: 'user-1',
      userType: UserType.User,
      taskId: 'relay-task-1',
      model: 'relay-video-model',
      channel: AiLogChannel.Relay,
      type: AiLogType.Video,
      request: {
        model: 'relay-video-model',
        prompt: 'A vertical product video',
        remoteTaskId: 'relay-task-1',
      },
      response: {
        id: 'relay-task-1',
        status: 'queued',
      },
      status: AiLogStatus.Generating,
    })
  })

  it('forwards media fields without converting local paths or storage urls', async () => {
    await service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'relay-video-model',
      prompt: 'A video with references',
      image: 'images/start.png',
      image_tail: 'https://cdn.example.com/images/end.png?version=1',
      video_url: 'videos/source.mp4',
      images: ['images/ref.png', 'https://external.example.com/ref.png'],
      videos: ['https://storage.example.com/videos/ref.mp4'],
      audios: ['audios/ref.mp3'],
    })

    expect(mockRelayLibService.createVideo).toHaveBeenCalledWith(expect.objectContaining({
      image: 'images/start.png',
      image_tail: 'https://cdn.example.com/images/end.png?version=1',
      video_url: 'videos/source.mp4',
      images: ['images/ref.png', 'https://external.example.com/ref.png'],
      videos: ['https://storage.example.com/videos/ref.mp4'],
      audios: ['audios/ref.mp3'],
    }))
  })

  it('keeps local groupId in ai log but does not forward it to upstream relay', async () => {
    await service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'relay-video-model',
      prompt: 'A video saved locally',
      groupId: 'local-group-1',
    })

    const payload = mockRelayLibService.createVideo.mock.calls[0][0]
    expect('groupId' in payload).toBe(false)

    const createdLog = mockAiLogRepo.create.mock.calls[0][0]
    expect(createdLog.request).toMatchObject({
      groupId: 'local-group-1',
      remoteTaskId: 'relay-task-1',
    })
  })

  it('rejects unsupported model mode before calling upstream relay', async () => {
    await expect(service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'relay-video-model',
      prompt: 'A video',
      mode: 'image2video',
    })).rejects.toThrow()

    expect(mockRelayLibService.createVideo).not.toHaveBeenCalled()
  })

  it('returns relay media inputs in task input', () => {
    expect(service.extractInput({
      model: 'relay-video-model',
      prompt: 'A video with references',
      groupId: 'local-group-1',
      image: ['images/start.png', 'images/second.png'],
      images: ['images/ref.png'],
      video_url: 'videos/source.mp4',
      videos: ['videos/ref.mp4'],
      audios: ['audios/ref.mp3'],
      duration: 5,
      resolution: '720p',
      ratio: '9:16',
      watermark: true,
    })).toEqual({
      prompt: 'A video with references',
      groupId: 'local-group-1',
      image: ['images/start.png', 'images/second.png'],
      images: ['images/ref.png'],
      videoUrl: 'videos/source.mp4',
      videos: ['videos/ref.mp4'],
      audios: ['audios/ref.mp3'],
      duration: 5,
      resolution: '720p',
      aspectRatio: '9:16',
      watermark: true,
    })
  })

  it('keeps relay callback video urls unchanged on success', async () => {
    const aiLog = {
      id: 'ai-log-1',
      userId: 'user-1',
      userType: UserType.User,
      taskId: 'relay-task-1',
      model: 'relay-video-model',
      channel: AiLogChannel.Relay,
      type: AiLogType.Video,
      status: AiLogStatus.Generating,
      startedAt: new Date(Date.now() - 1000),
      request: {
        model: 'relay-video-model',
        prompt: 'A video',
      },
    } as unknown as AiLog
    mockAiLogRepo.getByTaskId.mockResolvedValue(aiLog)
    mockAiLogRepo.updateByIdAndStatus.mockResolvedValue(aiLog)

    await expect(service.callback({
      id: 'relay-task-1',
      status: 'success',
      videoUrl: 'https://relay.example.com/videos/out.mp4',
      coverUrl: 'https://relay.example.com/covers/out.png',
    })).resolves.toEqual({
      id: 'relay-task-1',
      status: 'success',
      videoUrl: 'https://relay.example.com/videos/out.mp4',
      coverUrl: 'https://relay.example.com/covers/out.png',
    })

    expect(mockAiLogRepo.updateByIdAndStatus).toHaveBeenCalledWith(
      'ai-log-1',
      AiLogStatus.Generating,
      expect.objectContaining({
        $set: expect.objectContaining({
          status: AiLogStatus.Success,
          response: {
            id: 'relay-task-1',
            status: 'success',
            videoUrl: 'https://relay.example.com/videos/out.mp4',
            coverUrl: 'https://relay.example.com/covers/out.png',
          },
        }),
      }),
    )
    expect(mockAiAvailability.recordAsyncComplete).toHaveBeenCalledWith(
      'relay-task-1',
      { provider: 'relay', operation: 'videoGeneration', model: 'relay-video-model' },
      expect.objectContaining({ success: true }),
    )
  })

  it('marks terminal relay failures', async () => {
    const aiLog = {
      id: 'ai-log-1',
      userId: 'user-1',
      userType: UserType.User,
      taskId: 'relay-task-1',
      model: 'relay-video-model',
      channel: AiLogChannel.Relay,
      type: AiLogType.Video,
      status: AiLogStatus.Generating,
      startedAt: new Date(Date.now() - 1000),
      request: {
        model: 'relay-video-model',
        prompt: 'A video',
      },
    } as unknown as AiLog
    mockAiLogRepo.getByTaskId.mockResolvedValue(aiLog)
    mockAiLogRepo.updateByIdAndStatus.mockResolvedValue(aiLog)

    await service.callback({
      id: 'relay-task-1',
      status: 'failed',
      error: { message: 'upstream failed' },
    })

    expect(mockAiLogRepo.updateByIdAndStatus).toHaveBeenCalledWith(
      'ai-log-1',
      AiLogStatus.Generating,
      expect.objectContaining({
        $set: expect.objectContaining({
          status: AiLogStatus.Failed,
          errorMessage: 'upstream failed',
        }),
      }),
    )
    expect(mockAiAvailability.recordAsyncComplete).toHaveBeenCalledWith(
      'relay-task-1',
      { provider: 'relay', operation: 'videoGeneration', model: 'relay-video-model' },
      expect.objectContaining({ success: false, errorMessage: 'upstream failed' }),
    )
  })
})
