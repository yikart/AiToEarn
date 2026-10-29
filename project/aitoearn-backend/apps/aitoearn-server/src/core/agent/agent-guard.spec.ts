import { AgentErrorCode } from '@airongrong/plugin-api'
import { describe, expect, it, vi } from 'vitest'
import { AGENT_CORE_TOOLS, isWriteTool, MAX_AGENT_TOOLS, selectAgentTools } from './agent-tool-policy'
import { DEFAULT_WRITE_RATE, WriteConfirmService } from './write-confirm'

// 后端实际注册的工具（available 以真实工具名为准，契约名不直接出现在注册表）
const ALL_TOOLS = [
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
  'getChannelWorkDetail',
  'getChannelPublishRecordByTaskId',
  'listChannelEngagementComments',
  'cancelChannelPublishTask',
  'requestChannelPublishUpdate',
  'submitChannelEngagementComment',
  'callChannelEngagementFunction',
  'verifyChannelWorkOwnership',
]

describe('agentToolPolicy', () => {
  it('核心集合不超过 15 个工具（§12.2 上限）', () => {
    expect(AGENT_CORE_TOOLS.length).toBeLessThanOrEqual(MAX_AGENT_TOOLS)
  })

  it('core 模式只暴露有后端实现的契约工具，其余隐藏', () => {
    const selection = selectAgentTools(ALL_TOOLS, 'core')
    expect(selection.overBudget).toBe(false)
    // 已实现的 6 个契约（hot_topics / validate_content / revoke_post / earn 三件套为占位，不暴露）
    expect(selection.exposed).toEqual([
      'list_accounts',
      'create_draft',
      'publish_post',
      'schedule_post',
      'list_posts',
      'get_metrics',
    ])
    expect(selection.hidden).toContain('verifyChannelWorkOwnership')
    expect(selection.hidden).toContain('listChannelEngagementComments')
    expect(selection.exposed.length).toBeLessThanOrEqual(MAX_AGENT_TOOLS)
  })

  it('full 模式暴露全部并标记超预算', () => {
    const selection = selectAgentTools(ALL_TOOLS, 'full')
    expect(selection.exposed).toHaveLength(ALL_TOOLS.length)
    expect(selection.overBudget).toBe(true)
  })

  it('写操作契约清单在预算内且覆盖已实现写工具', () => {
    const writes = AGENT_CORE_TOOLS.filter(isWriteTool)
    expect(writes).toEqual(['publish_post', 'schedule_post', 'revoke_post', 'accept_earn_task', 'submit_earn_task'])
    expect(writes.length).toBeLessThanOrEqual(MAX_AGENT_TOOLS)
    // 已实现的后端写工具同样判定为写工具（控制器层护栏按后端名调用）
    expect(isWriteTool('publishChannelTaskNow')).toBe(true)
  })
})

describe('writeConfirmService', () => {
  const service = new WriteConfirmService()

  it('默认 dryRun：不执行副作用，返回计划与令牌', async () => {
    const execute = vi.fn(async () => 'executed')
    const plan = await service.guard('publishChannelTaskNow', { taskId: 't-1' }, execute) as { dryRun: boolean, confirmToken: string }
    expect(execute).not.toHaveBeenCalled()
    expect(plan.dryRun).toBe(true)
    expect(plan.confirmToken).toBeTruthy()
  })

  it('未携带令牌直接写入 → AIT-AG-002', async () => {
    const execute = vi.fn(async () => 'executed')
    await expect(service.guard('publishChannelTaskNow', { taskId: 't-1', dryRun: false }, execute))
      .rejects
      .toMatchObject({ code: AgentErrorCode.WriteNotConfirmed })
    expect(execute).not.toHaveBeenCalled()
  })

  it('令牌与参数绑定：参数变化后令牌失效', async () => {
    const execute = vi.fn(async () => 'executed')
    const plan = await service.guard('publishChannelTaskNow', { taskId: 't-1' }, execute) as { confirmToken: string }
    await expect(service.guard(
      'publishChannelTaskNow',
      { taskId: 't-2', dryRun: false, confirmToken: plan.confirmToken },
      execute,
    )).rejects.toMatchObject({ code: AgentErrorCode.WriteNotConfirmed })
    expect(execute).not.toHaveBeenCalled()
  })

  it('写操作频率超过上限 → AIT-AG-003', async () => {
    const limited = new WriteConfirmService()
    const execute = vi.fn(async () => 'executed')
    const params = { taskId: 'rate-1' }
    for (let i = 0; i < DEFAULT_WRITE_RATE.max; i++) {
      const plan = await limited.guard('publishChannelTaskNow', params, execute, 'user-1') as { confirmToken: string }
      await limited.guard('publishChannelTaskNow', { ...params, dryRun: false, confirmToken: plan.confirmToken }, execute, 'user-1')
    }
    const plan = await limited.guard('publishChannelTaskNow', params, execute, 'user-1') as { confirmToken: string }
    await expect(limited.guard(
      'publishChannelTaskNow',
      { ...params, dryRun: false, confirmToken: plan.confirmToken },
      execute,
      'user-1',
    )).rejects.toMatchObject({ code: AgentErrorCode.RateLimited })
  })

  it('携带有效令牌才真正执行，且令牌一次性', async () => {
    const execute = vi.fn(async () => 'executed')
    const plan = await service.guard('cancelChannelPublishTask', { taskId: 't-1' }, execute) as { confirmToken: string }
    const result = await service.guard(
      'cancelChannelPublishTask',
      { taskId: 't-1', dryRun: false, confirmToken: plan.confirmToken },
      execute,
    )
    expect(result).toBe('executed')
    expect(execute).toHaveBeenCalledOnce()
    await expect(service.guard(
      'cancelChannelPublishTask',
      { taskId: 't-1', dryRun: false, confirmToken: plan.confirmToken },
      execute,
    )).rejects.toMatchObject({ code: AgentErrorCode.WriteNotConfirmed })
  })
})
