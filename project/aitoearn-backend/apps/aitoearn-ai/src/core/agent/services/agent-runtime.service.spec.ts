import { query } from '@anthropic-ai/claude-agent-sdk'
import { UserType } from '@yikart/common'
import { ContentGenerationTaskStatus } from '@yikart/mongodb'
import { lastValueFrom } from 'rxjs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../config'
import { CLAUDE_CODE_ROUTER_PROVIDER_NAME } from '../agent.constants'
import { AgentRuntimeService } from './agent-runtime.service'

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  AbortError: class AbortError extends Error {},
  createSdkMcpServer: vi.fn(),
  query: vi.fn(() => (async function* () {})()),
}))

vi.mock('@yikart/assets', async () => {
  const { z } = await import('zod')

  return {
    StorageProvider: class StorageProvider {},
    assetsConfigSchema: z.looseObject({}),
  }
})

vi.mock('../../ai-availability', async () => {
  const { z } = await import('zod')

  return {
    AiAvailabilityService: class AiAvailabilityService {},
    aiAvailabilityConfigSchema: z.looseObject({}),
  }
})

vi.mock('../../../config', () => ({
  config: {
    agent: {
      models: [
        'deepseek-anthropic-chat',
        'deepseek-anthropic-lite',
        'deepseek-anthropic-reasoner',
      ],
      defaultModel: 'deepseek-anthropic-chat',
      backgroundModel: 'deepseek-anthropic-lite',
      taskTimeoutMs: 60 * 60 * 1000,
    },
    serverClient: {
      baseUrl: 'https://server.local',
    },
  },
}))

vi.mock('../mcp/image-edit.mcp', () => ({
  ImageEditMcp: class ImageEditMcp {},
  ImageEditToolName: {},
}))

vi.mock('../mcp/media.mcp', () => ({
  MediaMcp: class MediaMcp {},
  MediaToolName: {},
}))

vi.mock('../mcp/subtitle.mcp', () => ({
  SubtitleMcp: class SubtitleMcp {},
  SubtitleToolName: {},
}))

vi.mock('../mcp/util.mcp', () => ({
  UtilMcp: class UtilMcp {},
  UtilToolName: {
    GetCurrentTime: 'getCurrentTime',
    OutputTaskResult: 'outputTaskResult',
    SetTitle: 'setTitle',
    Wait: 'wait',
  },
}))

vi.mock('../mcp/video-utils.mcp', () => ({
  VideoUtilsMcp: class VideoUtilsMcp {},
  VideoUtilsToolName: {},
}))

vi.mock('../mcp/volcengine/aideo.mcp', () => ({
  AideoMcp: class AideoMcp {},
  AideoToolName: {},
}))

vi.mock('../mcp/volcengine/drama-recap.mcp', () => ({
  DramaRecapMcp: class DramaRecapMcp {},
  DramaRecapToolName: {},
}))

vi.mock('../mcp/volcengine/style-transfer.mcp', () => ({
  StyleTransferMcp: class StyleTransferMcp {},
  StyleTransferToolName: {},
}))

vi.mock('../mcp/volcengine/video-edit.mcp', () => ({
  VideoEditMcp: class VideoEditMcp {},
  VideoEditToolName: {},
}))

vi.mock('@yikart/mongodb', async () => {
  const { z } = await import('zod')

  return {
    AiLogChannel: {
      ClaudeAgent: 'claude-agent',
    },
    AiLogRepository: class AiLogRepository {},
    AiLogStatus: {
      Success: 'success',
    },
    AiLogType: {
      Agent: 'agent',
    },
    AssetType: {
      Temp: 'temp',
    },
    ContentGenerationTask: class ContentGenerationTask {},
    ContentGenerationTaskRepository: class ContentGenerationTaskRepository {},
    ContentGenerationTaskStatus: {
      Running: 'running',
      Completed: 'completed',
      RequiresAction: 'requires_action',
      Error: 'error',
      Aborted: 'aborted',
    },
    mongodbConfigSchema: z.object({
      uri: z.string(),
      dbName: z.string().optional(),
      autoIndex: z.boolean().optional(),
      autoCreate: z.boolean().optional(),
    }),
  }
})

const originalAgentConfig = { ...config.agent }

interface QueryAgentOptions {
  model: string
  prompt: string
}

interface QueryOptions {
  model?: string
  agents: Record<string, QueryAgentOptions>
}

function createService() {
  return Reflect.construct(
    AgentRuntimeService,
    Array.from({ length: 14 }, () => ({})),
  ) as AgentRuntimeService
}

function createTaskService() {
  const mcp = { createServer: vi.fn(() => ({})) }
  const utilMcp = {
    server: {},
    createSetTitleTool: vi.fn(() => [{}, { pipe: vi.fn() }, vi.fn()]),
  }
  const contentGenerateRepository = {
    create: vi.fn(async () => ({ id: 'task-1' })),
    updateStatus: vi.fn(async () => undefined),
    updateMessage: vi.fn(async () => undefined),
  }
  const relayMediaResolver = {
    resolveJson: vi.fn(async () => {
      throw new Error('relay media failed')
    }),
  }
  const service = Reflect.construct(
    AgentRuntimeService,
    [
      mcp,
      mcp,
      utilMcp,
      mcp,
      {},
      contentGenerateRepository,
      {},
      mcp,
      mcp,
      mcp,
      mcp,
      mcp,
      {},
      relayMediaResolver,
    ],
  ) as AgentRuntimeService

  return {
    service,
    contentGenerateRepository,
    relayMediaResolver,
  }
}

function getQueryOptions() {
  const call = vi.mocked(query).mock.calls[0]?.[0] as { options: QueryOptions } | undefined
  return call?.options
}

describe('agentRuntimeService claudeQuery', () => {
  beforeEach(() => {
    vi.mocked(query).mockClear()
    Object.assign(config.agent, {
      defaultModel: 'deepseek-anthropic-chat',
      backgroundModel: 'deepseek-anthropic-lite',
    })
  })

  afterEach(() => {
    Object.assign(config.agent, originalAgentConfig)
  })

  it('uses config.agent.defaultModel when no model is provided', () => {
    const service = createService()

    service.claudeQuery(
      [{ type: 'text', text: '' }],
      [{ type: 'text', text: 'Hello' }],
      new AbortController(),
      {},
    )

    expect(getQueryOptions()?.model).toBe('deepseek-anthropic-chat')
  })

  it('uses the requested model and routes built-in subagents through the configured background model', () => {
    const service = createService()

    service.claudeQuery(
      [{ type: 'text', text: '' }],
      [{ type: 'text', text: 'Hello' }],
      new AbortController(),
      { model: 'deepseek-anthropic-reasoner' },
    )

    const options = getQueryOptions()
    const routePrefix = `<CCR-SUBAGENT-MODEL>${CLAUDE_CODE_ROUTER_PROVIDER_NAME},deepseek-anthropic-lite</CCR-SUBAGENT-MODEL>\n`

    expect(options?.model).toBe('deepseek-anthropic-reasoner')
    expect(options?.agents['polling-task'].model).toBe('inherit')
    expect(options?.agents['polling-task'].prompt.startsWith(routePrefix)).toBe(true)
    expect(options?.agents['skill-analyzer'].model).toBe('inherit')
    expect(options?.agents['skill-analyzer'].prompt.startsWith(routePrefix)).toBe(true)
  })
})

describe('agentRuntimeService createContentGenerationTask', () => {
  it('cleans up the running task when relay prompt preprocessing fails', async () => {
    const { service, contentGenerateRepository, relayMediaResolver } = createTaskService()
    const res = {
      closed: false,
      end: vi.fn(),
    }

    const chunk = await lastValueFrom(service.createContentGenerationTask({
      userId: 'user-1',
      userType: UserType.User,
      dto: {
        prompt: 'hello',
        model: config.agent.defaultModel,
        includePartialMessages: false,
      },
      abortController: new AbortController(),
      req: { headers: {} } as never,
      res: res as never,
    }))

    expect(chunk.type).toBe('error')
    expect(relayMediaResolver.resolveJson).toHaveBeenCalled()
    expect(contentGenerateRepository.updateStatus).toHaveBeenCalledWith('task-1', ContentGenerationTaskStatus.Running)
    expect(contentGenerateRepository.updateStatus).toHaveBeenCalledWith('task-1', ContentGenerationTaskStatus.Error)
    expect(res.end).toHaveBeenCalled()
    expect((service as unknown as { runningTasks: Map<string, unknown> }).runningTasks.size).toBe(0)
  })
})
