import { resolve } from 'node:path'
import { FileUtil } from '@yikart/common'
import { vi } from 'vitest'
import { z } from 'zod'

// ============================================
// 1. 初始化 FileUtil（必须在其他模块导入前执行）
// ============================================
FileUtil.init({
  endpoint: 'https://s3.example.com',
  cdnEndpoint: 'https://cdn.example.com',
})

// ============================================
// 2. Mock commander（防止测试时 CLI 解析）
// ============================================
vi.mock('commander', () => {
  const mockCommand = {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    requiredOption: vi.fn().mockReturnThis(),
    argument: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn().mockReturnThis(),
    parseAsync: vi.fn().mockResolvedValue(undefined),
    opts: vi.fn().mockReturnValue({
      config: resolve(__dirname, '../config/local.config.js'),
    }),
    args: [],
  }
  return {
    Command: vi.fn(() => mockCommand),
    program: mockCommand,
  }
})

// ============================================
// 3. Mock @yikart/mongodb（防止 schema 初始化错误）
// ============================================
vi.mock('@yikart/mongodb', () => ({
  AiLogType: {
    Chat: 'chat',
    Image: 'image',
    Card: 'card',
    Video: 'video',
    Agent: 'agent',
    Aideo: 'aideo',
    Crawler: 'crawler',
    StyleTransfer: 'style-transfer',
    VideoEdit: 'video-edit',
    DraftGeneration: 'draft-generation',
  },
  AiLogStatus: {
    Generating: 'generating',
    Success: 'success',
    Failed: 'failed',
  },
  AiLogChannel: {
    NewApi: 'new-api',
    Md2Card: 'md2card',
    FireflyCard: 'fireflyCard',
    Kling: 'kling',
    Volcengine: 'volcengine',
    Dashscope: 'dashscope',
    Sora2: 'sora2',
    OpenAI: 'openai',
    ClaudeAgent: 'claude-agent',
    Crawler: 'crawler',
    StyleTransfer: 'style-transfer',
    Gemini: 'gemini',
    Jimeng: 'jimeng',
    Grok: 'grok',
  },
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    Temp: 'temp',
  },
  AssetStatus: {
    Pending: 'pending',
    Uploaded: 'uploaded',
    Confirmed: 'confirmed',
    Failed: 'failed',
  },
  ContentGenerationTaskStatus: {
    Running: 'running',
    Completed: 'completed',
    RequiresAction: 'requires_action',
    Error: 'error',
    Aborted: 'aborted',
  },
  ContentGenerationTaskRepository: class ContentGenerationTaskRepository {},
  AiLogRepository: class AiLogRepository {},
  AssetRepository: class AssetRepository {},
  mongodbConfigSchema: z.object({}).passthrough(),
}))

// ============================================
// 4. Mock @anthropic-ai/claude-agent-sdk（保留 tools 和 version 用于测试）
// ============================================
vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>()

  return {
    ...actual,
    createSdkMcpServer: (config: { name: string, version: string, tools: unknown[] }) => ({
      name: config.name,
      version: config.version,
      tools: config.tools,
      // 保留原始配置以便测试验证
      _config: config,
    }),
  }
})
