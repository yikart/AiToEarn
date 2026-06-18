import { query } from '@anthropic-ai/claude-agent-sdk'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../config'
import { CLAUDE_CODE_ROUTER_PROVIDER_NAME } from '../agent.constants'
import { AgentRuntimeService } from './agent-runtime.service'

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  AbortError: class AbortError extends Error {},
  createSdkMcpServer: vi.fn(),
  query: vi.fn(() => (async function* () {})()),
}))

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
    Array.from({ length: 21 }, () => ({})),
  ) as AgentRuntimeService
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
