import { describe, expect, it, vi } from 'vitest'

import { CreateContentGenerationTaskSchema } from './agent.dto'

vi.mock('../../config', () => ({
  config: {
    agent: {
      models: ['claude-opus-4-6', 'deepseek-anthropic-chat'],
      defaultModel: 'claude-opus-4-6',
    },
  },
}))

describe('createContentGenerationTaskSchema', () => {
  it('defaults to the configured Claude model', () => {
    const task = CreateContentGenerationTaskSchema.parse({
      prompt: 'Create a video script',
    })

    expect(task.model).toBe('claude-opus-4-6')
  })

  it('accepts a configured Anthropic-compatible third-party model', () => {
    const task = CreateContentGenerationTaskSchema.parse({
      prompt: 'Create a video script',
      model: 'deepseek-anthropic-chat',
    })

    expect(task.model).toBe('deepseek-anthropic-chat')
  })

  it('rejects models outside config.agent.models', () => {
    const result = CreateContentGenerationTaskSchema.safeParse({
      prompt: 'Create a video script',
      model: 'missing-model',
    })

    expect(result.success).toBe(false)
  })
})
