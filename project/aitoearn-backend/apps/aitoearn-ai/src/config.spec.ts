import { describe, expect, it } from 'vitest'
import { agentConfigSchema } from './config'

const baseAgentConfig = {
  baseUrl: 'https://agent.example.com/v1/messages',
  apiKey: 'agent-key',
  analysis: {
    apiKey: 'gemini-key',
  },
}

describe('agentConfigSchema', () => {
  it('applies the existing Claude model defaults', () => {
    const agentConfig = agentConfigSchema.parse(baseAgentConfig)

    expect(agentConfig.defaultModel).toBe('claude-opus-4-6')
    expect(agentConfig.backgroundModel).toBe('claude-haiku-4-5-20251001')
    expect(agentConfig.thinkModel).toBe('claude-opus-4-6')
    expect(agentConfig.models).toContain('claude-opus-4-6')
  })

  it('accepts an Anthropic-compatible third-party model set', () => {
    const agentConfig = agentConfigSchema.parse({
      ...baseAgentConfig,
      models: ['deepseek-anthropic-chat', 'deepseek-anthropic-lite'],
      defaultModel: 'deepseek-anthropic-chat',
      backgroundModel: 'deepseek-anthropic-lite',
      thinkModel: 'deepseek-anthropic-chat',
    })

    expect(agentConfig.models).toEqual(['deepseek-anthropic-chat', 'deepseek-anthropic-lite'])
    expect(agentConfig.defaultModel).toBe('deepseek-anthropic-chat')
  })

  it('rejects route models that are not configured', () => {
    expect(() => agentConfigSchema.parse({
      ...baseAgentConfig,
      models: ['deepseek-anthropic-chat'],
      defaultModel: 'missing-model',
      backgroundModel: 'deepseek-anthropic-chat',
      thinkModel: 'deepseek-anthropic-chat',
    })).toThrow(/defaultModel must be included in agent\.models/)
  })
})
