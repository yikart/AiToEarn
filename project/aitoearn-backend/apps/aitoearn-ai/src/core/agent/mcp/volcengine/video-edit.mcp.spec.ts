import { Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { CreditsType, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { vi } from 'vitest'
import { VolcengineService } from '../../../ai/libs/volcengine'
import { VideoEditMcp, VideoEditToolName } from './video-edit.mcp'

import { VolcengineVideoUtils } from './volcengine.utils'

// Mock VolcengineVideoUtils
vi.mock('./volcengine.utils', () => ({
  VolcengineVideoUtils: {
    saveVideoFromVid: vi.fn(),
  },
}))

describe('videoEditMcp', () => {
  let videoEditMcp: VideoEditMcp
  let mockLogger: Logger
  let mockVolcengineService: vi.Mocked<VolcengineService>
  let mockAssetsService: vi.Mocked<AssetsService>
  let mockCreditsHelper: vi.Mocked<CreditsHelperService>
  let mockAiLogRepo: vi.Mocked<AiLogRepository>

  const userId = 'test-user-id'
  const userType = UserType.User

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as Logger

    mockVolcengineService = {
      submitDirectEditTaskAsync: vi.fn(),
      getDirectEditResult: vi.fn(),
      getMediaInfos: vi.fn(),
    } as unknown as vi.Mocked<VolcengineService>

    // Mock the config property
    Object.defineProperty(mockVolcengineService, 'config', {
      value: { spaceName: 'test-space' },
      writable: true,
    })

    mockAssetsService = {} as vi.Mocked<AssetsService>

    mockCreditsHelper = {
      deductCredits: vi.fn().mockResolvedValue(undefined),
      addCredits: vi.fn().mockResolvedValue(undefined),
    } as unknown as vi.Mocked<CreditsHelperService>

    mockAiLogRepo = {
      create: vi.fn(),
      getById: vi.fn(),
      updateById: vi.fn().mockResolvedValue(undefined),
    } as unknown as vi.Mocked<AiLogRepository>

    videoEditMcp = new VideoEditMcp(
      mockVolcengineService,
      mockAssetsService,
      mockCreditsHelper,
      mockAiLogRepo,
    )
    // Override the logger for testing
    Object.defineProperty(videoEditMcp, 'logger', { value: mockLogger })

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('createSubmitDirectEditTaskTool', () => {
    const sampleTrack = [
      [
        {
          Type: 'video' as const,
          Source: 'vid://test-video-id',
          TargetTime: [0, 10000] as [number, number],
          Extra: [
            {
              Type: 'transform' as const,
              PosX: 0,
              PosY: 0,
              Width: 1920,
              Height: 1080,
            },
          ],
        },
      ],
    ]

    const sampleCanvas = {
      Width: 1920,
      Height: 1080,
    }

    it('should have correct tool name', () => {
      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      expect(tool.name).toBe(VideoEditToolName.SubmitDirectEditTask)
    })

    it('should call volcengineService.submitDirectEditTaskAsync with correct params', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-123',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-123',
        userId,
        userType,
        taskId: 'req-123',
        model: 'video-edit',
        channel: AiLogChannel.Volcengine,
        type: AiLogType.VideoEdit,
        status: AiLogStatus.Generating,
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: sampleCanvas,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(mockVolcengineService.submitDirectEditTaskAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          Application: 'VideoTrackToB',
          EditParam: expect.objectContaining({
            Canvas: { Width: 1920, Height: 1080 },
            Track: sampleTrack,
          }),
        }),
      )
    })

    it('should deduct credits based on duration and resolution', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-123',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-123',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: sampleCanvas,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(mockCreditsHelper.deductCredits).toHaveBeenCalledWith({
        userId,
        amount: expect.any(Number),
        type: CreditsType.AiService,
        description: expect.stringContaining('Video Edit'),
        metadata: expect.objectContaining({
          taskId: 'req-123',
          duration: 10, // 10000ms = 10s
          resolution: '1920x1080',
        }),
      })
    })

    it('should create AI log record', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-123',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-123',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: sampleCanvas,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(mockAiLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          userType,
          taskId: 'req-123',
          model: 'video-edit',
          channel: AiLogChannel.Volcengine,
          type: AiLogType.VideoEdit,
          status: AiLogStatus.Generating,
        }),
      )
    })

    it('should return success result with task id', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-123',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-123',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      const result = await tool.handler({
        Canvas: sampleCanvas,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('ailog-123')
      expect(textContent.text).toContain('submitted')
    })

    it('should handle Output configuration', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-123',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-123',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: sampleCanvas,
        Track: sampleTrack,
        Output: {
          Fps: 30,
          DisableAudio: false,
          Codec: {
            VideoCodec: 'h264',
            AudioCodec: 'aac',
          },
        },
      }, {})

      expect(mockVolcengineService.submitDirectEditTaskAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          EditParam: expect.objectContaining({
            Output: expect.objectContaining({
              Fps: 30,
              DisableAudio: false,
              Codec: expect.objectContaining({
                VideoCodec: 'h264',
                AudioCodec: 'aac',
              }),
            }),
          }),
        }),
      )
    })

    it('should auto-detect Canvas from vid:// video source when Canvas is omitted', async () => {
      mockVolcengineService.getMediaInfos.mockResolvedValue({
        MediaInfoList: [{
          SourceInfo: { Width: 1280, Height: 720, Duration: 10, Size: 0, Bitrate: 0, Fps: 30, Format: 'mp4', Codec: 'h264' },
        }],
      } as never)
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-auto-canvas',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-auto',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: undefined,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(mockVolcengineService.getMediaInfos).toHaveBeenCalledWith({ Vids: 'test-video-id' })
      expect(mockVolcengineService.submitDirectEditTaskAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          EditParam: expect.objectContaining({
            Canvas: { Width: 1280, Height: 720 },
          }),
        }),
      )
    })

    it('should use provided Canvas directly without querying API', async () => {
      mockVolcengineService.submitDirectEditTaskAsync.mockResolvedValue({
        ReqId: 'req-explicit-canvas',
      })
      mockAiLogRepo.create.mockResolvedValue({
        id: 'ailog-explicit',
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      await tool.handler({
        Canvas: { Width: 720, Height: 1280 },
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(mockVolcengineService.getMediaInfos).not.toHaveBeenCalled()
      expect(mockVolcengineService.submitDirectEditTaskAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          EditParam: expect.objectContaining({
            Canvas: { Width: 720, Height: 1280 },
          }),
        }),
      )
    })

    it('should return error when no vid:// video source and no Canvas provided', async () => {
      const trackWithoutVid = [
        [
          {
            Type: 'image' as const,
            Source: 'mid://some-image',
            TargetTime: [0, 5000] as [number, number],
          },
        ],
      ]

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      const result = await tool.handler({
        Canvas: undefined,
        Track: trackWithoutVid,
        Output: undefined,
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Canvas')
    })

    it('should return error when getMediaInfos fails and no Canvas provided', async () => {
      mockVolcengineService.getMediaInfos.mockResolvedValue({
        MediaInfoList: [{ SourceInfo: undefined }],
      } as never)

      const tool = videoEditMcp.createSubmitDirectEditTaskTool(userId, userType)
      const result = await tool.handler({
        Canvas: undefined,
        Track: sampleTrack,
        Output: undefined,
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Canvas')
    })
  })

  describe('createGetVideoEditTaskStatusTool', () => {
    it('should have correct tool name', () => {
      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      expect(tool.name).toBe(VideoEditToolName.GetVideoEditTaskStatus)
    })

    it('should return error when task not found', async () => {
      mockAiLogRepo.getById.mockResolvedValue(null)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'non-existent' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('not found')
    })

    it('should return error when task record is invalid', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: null,
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('invalid')
    })

    it('should return success with output URL when task completed', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'success',
        OutputVid: 'output-vid-123',
      } as never)
      ;(VolcengineVideoUtils.saveVideoFromVid as jest.Mock).mockResolvedValue(
        'https://example.com/output.mp4',
      )

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('completed successfully')
      expect(textContent.text).toContain('https://example.com/output.mp4')
    })

    it('should update AI log on success', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'success',
        OutputVid: 'output-vid-123',
      } as never)
      ;(VolcengineVideoUtils.saveVideoFromVid as jest.Mock).mockResolvedValue(
        'https://example.com/output.mp4',
      )

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      await tool.handler({ taskId: 'ailog-123' }, {})

      expect(mockAiLogRepo.updateById).toHaveBeenCalledWith('ailog-123', {
        status: AiLogStatus.Success,
        finishedAt: expect.any(Date),
        response: expect.objectContaining({
          outputUrl: 'https://example.com/output.mp4',
          outputVid: 'output-vid-123',
        }),
      })
    })

    it('should return processing status when task is still running', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'processing',
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('still processing')
    })

    it('should return pending status', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'pending',
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('processing')
    })

    it('should return error and refund credits when task fails', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
        points: 10,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'failed',
        Message: 'Video processing error',
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('failed')
      expect(textContent.text).toContain('Video processing error')

      // Should refund credits
      expect(mockCreditsHelper.addCredits).toHaveBeenCalledWith({
        userId,
        amount: 10,
        type: CreditsType.AiService,
        description: expect.stringContaining('Refund'),
        metadata: expect.objectContaining({
          taskId: 'volc-task-123',
          reason: 'task_failed',
        }),
      })
    })

    it('should update AI log on failure', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
        points: 0,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'failed_run',
        Message: 'Processing error',
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      await tool.handler({ taskId: 'ailog-123' }, {})

      expect(mockAiLogRepo.updateById).toHaveBeenCalledWith('ailog-123', {
        status: AiLogStatus.Failed,
        finishedAt: expect.any(Date),
        response: expect.objectContaining({
          error: expect.stringContaining('Processing error'),
        }),
      })
    })

    it('should not refund credits if points is 0', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
        points: 0,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'failed',
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      await tool.handler({ taskId: 'ailog-123' }, {})

      expect(mockCreditsHelper.addCredits).not.toHaveBeenCalled()
    })

    it('should return error when video upload fails', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'success',
        OutputVid: 'output-vid-123',
      } as never)
      ;(VolcengineVideoUtils.saveVideoFromVid as jest.Mock).mockResolvedValue(null)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('failed to upload')
    })

    it('should return error when no output video found', async () => {
      mockAiLogRepo.getById.mockResolvedValue({
        id: 'ailog-123',
        taskId: 'volc-task-123',
        userId,
      } as never)
      mockVolcengineService.getDirectEditResult.mockResolvedValue({
        Status: 'success',
        OutputVid: null,
      } as never)

      const tool = videoEditMcp.createGetVideoEditTaskStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'ailog-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('no output video')
    })
  })

  describe('createServer', () => {
    it('should create server with correct name', () => {
      const server = videoEditMcp.createServer(userId, userType)
      expect(server.name).toBe('videoEdit')
    })

    it('should include expected tools', () => {
      const server = videoEditMcp.createServer(userId, userType) as { tools?: Array<{ name: string }> }
      const toolNames = server.tools?.map(t => t.name)

      expect(toolNames).toContain(VideoEditToolName.SubmitDirectEditTask)
      expect(toolNames).toContain(VideoEditToolName.GetVideoEditTaskStatus)
    })

    it('should have version 1.0.0', () => {
      const server = videoEditMcp.createServer(userId, userType) as { version?: string }
      expect(server.version).toBe('1.0.0')
    })
  })
})
