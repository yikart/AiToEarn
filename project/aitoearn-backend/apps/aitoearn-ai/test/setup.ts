import { resolve } from 'node:path'
import { FileUtil } from '@yikart/common'
import { vi } from 'vitest'

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
// 3. Mock @nestjs/mongoose（防止 schema 初始化错误）
// ============================================
vi.mock('@nestjs/mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/mongoose')>()

  const createMockSchema = () => ({
    index: vi.fn().mockReturnThis(),
    pre: vi.fn().mockReturnThis(),
    post: vi.fn().mockReturnThis(),
    virtual: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    plugin: vi.fn().mockReturnThis(),
  })

  return {
    ...actual,
    Prop: () => () => {},
    Schema: () => (target: unknown) => target,
    SchemaFactory: {
      createForClass: () => createMockSchema(),
    },
  }
})

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
