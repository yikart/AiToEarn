import { Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import { vi } from 'vitest'
import type { Mocked } from 'vitest'
import { z } from 'zod'
import type { ImageService } from '../../ai/image'
import type { GeminiVideoService, GrokVideoService, OpenAIVideoService } from '../../ai/video'
import { MediaMcp, MediaToolName } from './media.mcp'

vi.mock('../../ai/video', () => ({
  geminiVeoVideoCreateRequestSchema: z.object({}).passthrough(),
  GeminiVideoService: class GeminiVideoService {},
  GrokVideoService: class GrokVideoService {},
  OpenAIVideoService: class OpenAIVideoService {},
}))

describe('mediaMcp', () => {
  let mediaMcp: MediaMcp
  let mockLogger: Logger
  let mockOpenaiVideoService: Mocked<OpenAIVideoService>
  let mockImageService: Mocked<ImageService>
  let mockGeminiVideoService: Mocked<GeminiVideoService>
  let mockGrokVideoService: Mocked<GrokVideoService>

  const userId = 'test-user-id'
  const userType = UserType.User

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as Logger

    mockOpenaiVideoService = {
      createVideo: vi.fn(),
      getVideo: vi.fn(),
      createCharacter: vi.fn(),
      getCharacter: vi.fn(),
    } as unknown as Mocked<OpenAIVideoService>

    mockImageService = {
      userGeminiGeneration: vi.fn(),
    } as unknown as Mocked<ImageService>

    mockGeminiVideoService = {
      createVideo: vi.fn(),
      getVideo: vi.fn(),
    } as unknown as Mocked<GeminiVideoService>

    mockGrokVideoService = {
      createVideo: vi.fn(),
      getTask: vi.fn(),
    } as unknown as Mocked<GrokVideoService>

    mediaMcp = new MediaMcp(
      mockOpenaiVideoService,
      mockImageService,
      mockGeminiVideoService,
      mockGrokVideoService,
    )
    // Override the logger for testing
    Object.defineProperty(mediaMcp, 'logger', { value: mockLogger })
  })

  describe('createGenerateImageTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGenerateImageTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GenerateImage)
    })

    it('should call imageService.userGeminiGeneration with correct params', async () => {
      mockImageService.userGeminiGeneration.mockResolvedValue({
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, input_token_details: undefined, output_token_details: undefined, points: 10 },
        images: [{ url: 'https://example.com/image1.png', data: '', mimeType: 'image/png' }],
      })

      const tool = mediaMcp.createGenerateImageTool(userId, userType)
      await tool.handler({
        prompt: 'A cute cat',
        imageUrls: ['https://example.com/ref.png'],
        imageSize: '2K',
        aspectRatio: '16:9',
      } as never, {})

      expect(mockImageService.userGeminiGeneration).toHaveBeenCalledWith({
        userId,
        userType,
        prompt: 'A cute cat',
        imageUrls: ['https://example.com/ref.png'],
        imageSize: '2K',
        aspectRatio: '16:9',
      })
    })

    it('should pass selected gemini image model when provided', async () => {
      mockImageService.userGeminiGeneration.mockResolvedValue({
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, input_token_details: undefined, output_token_details: undefined, points: 10 },
        images: [{ url: 'https://example.com/image1.png', data: '', mimeType: 'image/png' }],
      })

      const tool = mediaMcp.createGenerateImageTool(userId, userType)
      await tool.handler({
        prompt: 'A cute cat',
        model: 'gemini-3-pro-image-preview',
      } as never, {})

      expect(mockImageService.userGeminiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-pro-image-preview',
        }),
      )
    })

    it('should return generated image URLs', async () => {
      mockImageService.userGeminiGeneration.mockResolvedValue({
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, input_token_details: undefined, output_token_details: undefined, points: 10 },
        images: [
          { url: 'image1.png', data: '', mimeType: 'image/png' },
          { url: 'image2.png', data: '', mimeType: 'image/png' },
        ],
      })

      const tool = mediaMcp.createGenerateImageTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A cute cat',
        imageUrls: [],
        imageSize: undefined,
        aspectRatio: undefined,
      } as never, {})

      expect(result.isError).toBeUndefined()
      expect(result.content).toBeDefined()
      expect(result.content.length).toBeGreaterThan(0)

      // Should contain resource_link entries
      const resourceLinks = result.content.filter(c => c.type === 'resource_link')
      expect(resourceLinks.length).toBe(2)
    })

    it('should use default empty array for imageUrls when not provided', async () => {
      mockImageService.userGeminiGeneration.mockResolvedValue({
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, input_token_details: undefined, output_token_details: undefined, points: 10 },
        images: [{ url: 'image.png', data: '', mimeType: 'image/png' }],
      })

      const tool = mediaMcp.createGenerateImageTool(userId, userType)
      await tool.handler({
        prompt: 'A cute cat',
        imageUrls: [],
        imageSize: undefined,
        aspectRatio: undefined,
      } as never, {})

      expect(mockImageService.userGeminiGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrls: [],
        }),
      )
    })
  })

  describe('createGenerateVideoTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GenerateVideo)
    })

    it('should call openaiVideoService.createVideo with correct params', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: 'in_progress',
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2',
        input_reference: undefined,
        seconds: undefined,
        size: undefined,
      } as never, {})

      expect(mockOpenaiVideoService.createVideo).toHaveBeenCalledWith({
        userId,
        userType,
        prompt: 'A cat walking',
        input_reference: undefined,
        model: 'sora-2',
        seconds: '10',
        size: '720x1280',
      })
    })

    it('should use sora-2-pro defaults when model is sora-2-pro', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: 'in_progress',
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2-pro',
        input_reference: undefined,
        seconds: undefined,
        size: undefined,
      } as never, {})

      expect(mockOpenaiVideoService.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          seconds: '25',
          size: '1024x1792',
        }),
      )
    })

    it('should return success result with task id', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: 'in_progress',
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2',
        input_reference: undefined,
        seconds: undefined,
        size: undefined,
      } as never, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('task-123')
    })

    it('should pass explicit seconds and size without defaults', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: 'in_progress',
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2',
        input_reference: undefined,
        seconds: '8',
        size: '1280x720',
      } as never, {})

      expect(mockOpenaiVideoService.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          seconds: '8',
          size: '1280x720',
        }),
      )
    })

    it('should return error result when video generation fails', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: AiLogStatus.Failed,
        error: { code: 'policy_violation', message: 'Content policy violation' },
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2',
        input_reference: undefined,
        seconds: undefined,
        size: undefined,
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Failed')
    })

    it('should return unknown error when video generation fails without error detail', async () => {
      mockOpenaiVideoService.createVideo.mockResolvedValue({
        id: 'task-123',
        status: AiLogStatus.Failed,
      } as never)

      const tool = mediaMcp.createGenerateVideoTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A cat walking',
        model: 'sora-2',
        input_reference: undefined,
        seconds: undefined,
        size: undefined,
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Unknown error')
    })
  })

  describe('createGetVideoStatusTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GetVideoStatus)
    })

    it('should return completed status with video URL', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'completed',
        url: 'video.mp4',
        progress: 100,
        created_at: Math.floor(Date.now() / 1000) - 60,
        completed_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        error: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      })

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('completed')
      expect(textContent.text).toContain('video.mp4')
    })

    it('should return completed status with video_url fallback and no start time', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'completed',
        video_url: 'fallback-video.mp4',
        progress: 100,
        created_at: 0,
        completed_at: null,
        expires_at: null,
        error: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      } as never)

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('fallback-video.mp4')
      expect(textContent.text).not.toContain('Start time:')
    })

    it('should fall through completed status without video URL', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'completed',
        progress: 100,
        created_at: 0,
        completed_at: null,
        expires_at: null,
        error: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      } as never)

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Video is completed, progress: 100%')
    })

    it('should return failed status with error message', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'failed',
        progress: 0,
        error: { code: 'error', message: 'Processing error' },
        created_at: Math.floor(Date.now() / 1000) - 60,
        completed_at: null,
        expires_at: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      })

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('failed')
      expect(textContent.text).toContain('Processing error')
    })

    it('should return failed status with unknown error when message missing', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'failed',
        progress: 0,
        error: null,
        created_at: 0,
        completed_at: null,
        expires_at: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      })

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Unknown error')
    })

    it('should return progress status when still processing', async () => {
      mockOpenaiVideoService.getVideo.mockResolvedValue({
        id: 'task-123',
        object: 'video',
        model: 'sora-2',
        prompt: 'test',
        status: 'in_progress',
        progress: 50,
        created_at: Math.floor(Date.now() / 1000) - 30,
        completed_at: null,
        expires_at: null,
        error: null,
        remixed_from_video_id: null,
        seconds: '10',
        size: '720x1280',
      })

      const tool = mediaMcp.createGetVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('in_progress')
      expect(textContent.text).toContain('50%')
    })
  })

  describe('createSoraCharacterTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createSoraCharacterTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.CreateSoraCharacter)
    })

    it('should call openaiVideoService.createCharacter with correct params', async () => {
      mockOpenaiVideoService.createCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'processing',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createSoraCharacterTool(userId, userType)
      await tool.handler({
        prompt: 'A young woman',
        videoUrl: 'https://example.com/video.mp4',
        taskId: undefined,
        timestamps: '1,3',
      } as never, {})

      expect(mockOpenaiVideoService.createCharacter).toHaveBeenCalledWith({
        userId,
        userType,
        prompt: 'A young woman',
        videoUrl: 'https://example.com/video.mp4',
        taskId: undefined,
        timestamps: '1,3',
      })
    })

    it('should return success result with character id and username', async () => {
      mockOpenaiVideoService.createCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'processing',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createSoraCharacterTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A young woman',
        videoUrl: undefined,
        taskId: undefined,
        timestamps: '1,3',
      } as never, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('char-123')
      expect(textContent.text).toContain('@testchar')
    })

    it('should return error when character creation fails', async () => {
      mockOpenaiVideoService.createCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'failed',
        created_at: Math.floor(Date.now() / 1000),
        error: { code: 400, message: 'Invalid video' },
      })

      const tool = mediaMcp.createSoraCharacterTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A young woman',
        videoUrl: undefined,
        taskId: undefined,
        timestamps: '1,3',
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Failed')
    })

    it('should return unknown error when character creation fails without error detail', async () => {
      mockOpenaiVideoService.createCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'failed',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createSoraCharacterTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A young woman',
        videoUrl: undefined,
        taskId: undefined,
        timestamps: '1,3',
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Unknown error')
    })
  })

  describe('createGetSoraCharacterTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGetSoraCharacterTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GetSoraCharacter)
    })

    it('should return completed status with username', async () => {
      mockOpenaiVideoService.getCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'completed',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createGetSoraCharacterTool(userId, userType)
      const result = await tool.handler({ characterId: 'char-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('ready')
      expect(textContent.text).toContain('@testchar')
    })

    it('should return failed status with error', async () => {
      mockOpenaiVideoService.getCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'failed',
        created_at: Math.floor(Date.now() / 1000),
        error: { code: 500, message: 'Processing failed' },
      })

      const tool = mediaMcp.createGetSoraCharacterTool(userId, userType)
      const result = await tool.handler({ characterId: 'char-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('failed')
    })

    it('should return failed status with unknown error when message missing', async () => {
      mockOpenaiVideoService.getCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'failed',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createGetSoraCharacterTool(userId, userType)
      const result = await tool.handler({ characterId: 'char-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Unknown error')
    })

    it('should return processing status', async () => {
      mockOpenaiVideoService.getCharacter.mockResolvedValue({
        id: 'char-123',
        object: 'character',
        model: 'sora-2-character',
        username: 'testchar',
        status: 'processing',
        created_at: Math.floor(Date.now() / 1000),
      })

      const tool = mediaMcp.createGetSoraCharacterTool(userId, userType)
      const result = await tool.handler({ characterId: 'char-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('processing')
    })
  })

  describe('createGenerateVideoWithVeoTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGenerateVideoWithVeoTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GenerateVideoWithVeo)
    })

    it('should call geminiVideoService.createVideo with correct params', async () => {
      mockGeminiVideoService.createVideo.mockResolvedValue({
        id: 'veo-task-123',
      })

      const tool = mediaMcp.createGenerateVideoWithVeoTool(userId, userType)
      await tool.handler({
        params: {
          prompt: 'A sunset over the ocean',
          model: 'veo-3.1-fast-generate-001',
          aspectRatio: '16:9',
          duration: 8,
          resolution: '720p',
        },
      } as never, {})

      expect(mockGeminiVideoService.createVideo).toHaveBeenCalledWith({
        userId,
        userType,
        prompt: 'A sunset over the ocean',
        model: 'veo-3.1-fast-generate-001',
        aspectRatio: '16:9',
        duration: 8,
        resolution: '720p',
      })
    })

    it('should return success result with task id', async () => {
      mockGeminiVideoService.createVideo.mockResolvedValue({
        id: 'veo-task-123',
      })

      const tool = mediaMcp.createGenerateVideoWithVeoTool(userId, userType)
      const result = await tool.handler({
        params: {
          prompt: 'A sunset over the ocean',
          model: 'veo-3.1-fast-generate-001',
          aspectRatio: '16:9',
          duration: 8,
          resolution: '720p',
        },
      } as never, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('veo-task-123')
    })

    it('should return error when video generation fails', async () => {
      mockGeminiVideoService.createVideo.mockResolvedValue({
        id: 'veo-task-123',
        error: { code: 400, message: 'Content policy violation' },
      })

      const tool = mediaMcp.createGenerateVideoWithVeoTool(userId, userType)
      const result = await tool.handler({
        params: {
          prompt: 'A sunset over the ocean',
          model: 'veo-3.1-fast-generate-001',
          aspectRatio: '16:9',
          duration: 8,
          resolution: '720p',
        },
      } as never, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Failed')
    })
  })

  describe('createGetVeoVideoStatusTool', () => {
    it('should have correct tool name', () => {
      const tool = mediaMcp.createGetVeoVideoStatusTool(userId, userType)
      expect(tool.name).toBe(MediaToolName.GetVeoVideoStatus)
    })

    it('should return completed status with video URLs', async () => {
      mockGeminiVideoService.getVideo.mockResolvedValue({
        name: 'test-operation',
        status: AiLogStatus.Success,
        model: 'veo-3.1-fast-generate-001',
        prompt: 'A sunset over the ocean',
        createdAt: new Date(Date.now() - 60000),
        completedAt: new Date(),
        generatedVideos: [
          { url: 'video1.mp4', gcsUrl: 'gs://bucket/video1.mp4' },
          { url: 'video2.mp4', gcsUrl: null },
        ],
      })

      const tool = mediaMcp.createGetVeoVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'veo-task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('completed')
      expect(textContent.text).toContain('video1.mp4')
      expect(textContent.text).toContain('gs://bucket/video1.mp4')
    })

    it('should return failed status with error message', async () => {
      mockGeminiVideoService.getVideo.mockResolvedValue({
        name: 'test-operation',
        status: AiLogStatus.Failed,
        model: 'veo-3.1-fast-generate-001',
        prompt: 'A sunset over the ocean',
        createdAt: new Date(Date.now() - 60000),
        completedAt: null,
        generatedVideos: [],
        error: { code: 500, message: 'Generation failed' },
      })

      const tool = mediaMcp.createGetVeoVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'veo-task-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('failed')
      expect(textContent.text).toContain('Generation failed')
    })

    it('should return failed status with unknown error when error missing', async () => {
      mockGeminiVideoService.getVideo.mockResolvedValue({
        name: 'test-operation',
        status: AiLogStatus.Failed,
        model: 'veo-3.1-fast-generate-001',
        prompt: 'A sunset over the ocean',
        createdAt: new Date(Date.now() - 60000),
        completedAt: null,
        generatedVideos: [],
      })

      const tool = mediaMcp.createGetVeoVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'veo-task-123' }, {})

      expect(result.isError).toBe(true)
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Unknown error')
    })

    it('should return processing status', async () => {
      mockGeminiVideoService.getVideo.mockResolvedValue({
        name: 'test-operation',
        status: AiLogStatus.Generating,
        model: 'veo-3.1-fast-generate-001',
        prompt: 'A sunset over the ocean',
        createdAt: new Date(Date.now() - 30000),
        completedAt: null,
        generatedVideos: [],
      })

      const tool = mediaMcp.createGetVeoVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'veo-task-123' }, {})

      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain(AiLogStatus.Generating)
    })
  })

  describe('createGenerateVideoWithGrokTool', () => {
    it('should call grokVideoService.createVideo with correct params', async () => {
      mockGrokVideoService.createVideo.mockResolvedValue({ id: 'grok-task-123', requestId: 'req-123', points: 1 })

      const tool = mediaMcp.createGenerateVideoWithGrokTool(userId, userType)
      const result = await tool.handler({
        prompt: 'A cat walking',
        model: 'grok-imagine-video',
        aspectRatio: '16:9',
        resolution: '720p',
        duration: 6,
        imageUrl: 'https://example.com/ref.png',
      } as never, {})

      expect(mockGrokVideoService.createVideo).toHaveBeenCalledWith({
        userId,
        userType,
        prompt: 'A cat walking',
        model: 'grok-imagine-video',
        aspectRatio: '16:9',
        resolution: '720p',
        duration: 6,
        imageUrl: 'https://example.com/ref.png',
      })
      expect(result.isError).toBeUndefined()
      expect((result.content[0] as { text: string }).text).toContain('grok-task-123')
    })
  })

  describe('createGetGrokVideoStatusTool', () => {
    it('should return completed status with video URL', async () => {
      mockGrokVideoService.getTask.mockResolvedValue({
        status: 'succeeded',
        videoUrl: 'video.mp4',
      } as never)

      const tool = mediaMcp.createGetGrokVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'grok-task-123' }, {})

      expect(mockGrokVideoService.getTask).toHaveBeenCalledWith(userId, userType, 'grok-task-123')
      expect(result.isError).toBeUndefined()
      expect((result.content[0] as { text: string }).text).toContain('video.mp4')
    })

    it('should return error status with message', async () => {
      mockGrokVideoService.getTask.mockResolvedValue({
        status: 'failed',
        error: 'Generation failed',
      } as never)

      const tool = mediaMcp.createGetGrokVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'grok-task-123' }, {})

      expect(result.isError).toBe(true)
      expect((result.content[0] as { text: string }).text).toContain('Generation failed')
    })

    it('should return processing status', async () => {
      mockGrokVideoService.getTask.mockResolvedValue({
        status: 'processing',
      } as never)

      const tool = mediaMcp.createGetGrokVideoStatusTool(userId, userType)
      const result = await tool.handler({ taskId: 'grok-task-123' }, {})

      expect(result.isError).toBeUndefined()
      expect((result.content[0] as { text: string }).text).toContain('processing')
    })
  })

  describe('createServer', () => {
    it('should create server with correct name', () => {
      const server = mediaMcp.createServer(userId, userType)
      expect(server.name).toBe('mediaGeneration')
    })

    it('should include expected tools', () => {
      const server = mediaMcp.createServer(userId, userType) as { tools?: Array<{ name: string }> }
      const toolNames = server.tools?.map(t => t.name)

      expect(toolNames).toContain(MediaToolName.GenerateImage)
      expect(toolNames).toContain(MediaToolName.GenerateVideoWithGrok)
      expect(toolNames).toContain(MediaToolName.GetGrokVideoStatus)
    })
  })
})
