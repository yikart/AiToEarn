import { Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import { vi } from 'vitest'
import { ChatService } from '../../ai/chat'
import { ImageService } from '../../ai/image'
import { GeminiVideoService, OpenAIVideoService, Sora2VideoService } from '../../ai/video'
import { MediaMcp, MediaToolName } from './media.mcp'

describe('mediaMcp', () => {
  let mediaMcp: MediaMcp
  let mockLogger: Logger
  let mockChatService: vi.Mocked<ChatService>
  let mockOpenaiVideoService: vi.Mocked<OpenAIVideoService>
  let mockImageService: vi.Mocked<ImageService>
  let mockSora2VideoService: vi.Mocked<Sora2VideoService>
  let mockGeminiVideoService: vi.Mocked<GeminiVideoService>

  const userId = 'test-user-id'
  const userType = UserType.User

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as Logger

    mockChatService = {} as vi.Mocked<ChatService>

    mockOpenaiVideoService = {
      createVideo: vi.fn(),
      getVideo: vi.fn(),
      createCharacter: vi.fn(),
      getCharacter: vi.fn(),
    } as unknown as vi.Mocked<OpenAIVideoService>

    mockImageService = {
      userGeminiGeneration: vi.fn(),
    } as unknown as vi.Mocked<ImageService>

    mockSora2VideoService = {} as vi.Mocked<Sora2VideoService>

    mockGeminiVideoService = {
      createVideo: vi.fn(),
      getVideo: vi.fn(),
    } as unknown as vi.Mocked<GeminiVideoService>

    mediaMcp = new MediaMcp(
      mockChatService,
      mockOpenaiVideoService,
      mockImageService,
      mockSora2VideoService,
      mockGeminiVideoService,
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
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, points: 10 },
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
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, points: 10 },
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
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, points: 10 },
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
        usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300, points: 10 },
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

  describe('createServer', () => {
    it('should create server with correct name', () => {
      const server = mediaMcp.createServer(userId, userType)
      expect(server.name).toBe('mediaGeneration')
    })

    it('should include expected tools', () => {
      const server = mediaMcp.createServer(userId, userType) as { tools?: Array<{ name: string }> }
      const toolNames = server.tools?.map(t => t.name)

      expect(toolNames).toContain(MediaToolName.GenerateImage)
      expect(toolNames).toContain(MediaToolName.GenerateVideoWithVeo)
      expect(toolNames).toContain(MediaToolName.GetVeoVideoStatus)
    })
  })
})
