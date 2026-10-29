import { describe, expect, it } from 'vitest'
import { AGENT_CORE_TOOLS, AGENT_TOOL_BACKEND, agentCoreToolFilter, MAX_AGENT_TOOLS, selectAgentTools } from './agent-tool-policy'

describe('selectAgentTools', () => {
  it('exposes only contracts whose backend tools are registered', () => {
    const available = [
      'listChannelPlatforms',
      'createVideoDraft',
      'createImageTextDraft',
      'getDraftTaskStatus',
      'createChannelPublishFlow',
      'publishChannelTaskNow',
      'updateChannelPublishAt',
      'listChannelWorks',
      'listChannelPublishRecords',
      'getChannelWorkAnalytics',
      'getChannelAccountAnalytics',
      // 占位/未暴露工具
      'hotTopics',
      'validateContent',
      'submitChannelEngagementComment',
    ]
    const selection = selectAgentTools(available, 'core')

    expect(selection.exposed).toEqual(['list_accounts', 'create_draft', 'publish_post', 'schedule_post', 'list_posts', 'get_metrics'])
    expect(selection.hidden).toEqual(['hotTopics', 'validateContent', 'submitChannelEngagementComment'])
    expect(selection.overBudget).toBe(false)
  })

  it('exposes a contract when at least one of its backend tools is registered', () => {
    const selection = selectAgentTools(['publishChannelTaskNow'], 'core')
    expect(selection.exposed).toEqual(['publish_post'])
    expect(selection.hidden).toEqual([])
  })

  it('never exposes more than MAX_AGENT_TOOLS', () => {
    const available = Object.values(AGENT_TOOL_BACKEND).flat()
    const selection = selectAgentTools(available, 'core')
    expect(selection.exposed.length).toBeLessThanOrEqual(MAX_AGENT_TOOLS)
  })

  it('full profile exposes everything and only flags the budget', () => {
    const selection = selectAgentTools(['a', 'b'], 'full')
    expect(selection.exposed).toEqual(['a', 'b'])
    expect(selection.hidden).toEqual([])
  })
})

describe('agentCoreToolFilter', () => {
  it('keeps only backend tools of implemented contracts for the Agent surface', () => {
    const tools = [
      { name: 'listChannelPlatforms' },
      { name: 'createVideoDraft' },
      { name: 'hotTopics' },
      { name: 'submitChannelEngagementComment' },
    ]
    const filtered = agentCoreToolFilter(tools as never)
    expect(filtered.map(tool => tool.name)).toEqual(['listChannelPlatforms', 'createVideoDraft'])
  })

  it('hides every tool when none of the contract backends exist', () => {
    const filtered = agentCoreToolFilter([{ name: 'hotTopics' }] as never)
    expect(filtered).toEqual([])
  })

  it('covers every implemented contract in AGENT_TOOL_BACKEND', () => {
    for (const contract of Object.keys(AGENT_TOOL_BACKEND)) {
      expect(AGENT_CORE_TOOLS).toContain(contract)
    }
  })
})
