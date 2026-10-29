import type { ResultTool } from '@yikart/nest-mcp'

/**
 * Agent 工具暴露策略（方案 §12.2）。
 *
 * 两条硬约束：
 * 1. 面向 Agent 的工具数 ≤ 15，否则模型选择准确率明显下降、且每个 schema 都占上下文；
 * 2. 写操作默认 dry-run，必须先拿到 confirmToken 才真正执行。
 */
export const MAX_AGENT_TOOLS = 15

/** 面向 Agent 暴露的核心工具契约（方案 §12.2，12 个，工具名冻结见 §9） */
export const AGENT_CORE_TOOLS: readonly string[] = [
  'list_accounts',
  'hot_topics',
  'create_draft',
  'validate_content',
  'publish_post',
  'schedule_post',
  'list_posts',
  'get_metrics',
  'revoke_post',
  'list_earn_tasks',
  'accept_earn_task',
  'submit_earn_task',
]

/**
 * 契约工具 → 后端已实现工具映射（与 capability/capability.yaml 的 backend 字段同源）。
 * 未实现的契约为占位（无映射），selectAgentTools 不会暴露它们。
 */
export const AGENT_TOOL_BACKEND: Readonly<Record<string, readonly string[]>> = {
  list_accounts: ['listChannelPlatforms'],
  create_draft: ['createVideoDraft', 'createImageTextDraft', 'getDraftTaskStatus'],
  publish_post: ['createChannelPublishFlow', 'publishChannelTaskNow'],
  schedule_post: ['updateChannelPublishAt'],
  list_posts: ['listChannelWorks', 'listChannelPublishRecords'],
  get_metrics: ['getChannelWorkAnalytics', 'getChannelAccountAnalytics'],
}

/** 写操作契约工具（方案 §12.4）：必须经 dry-run 确认 */
export const WRITE_CONTRACT_TOOLS: readonly string[] = [
  'publish_post',
  'schedule_post',
  'revoke_post',
  'accept_earn_task',
  'submit_earn_task',
]

/** 契约工具对应的后端实现名集合（用于 tools/list 过滤时的隐藏判定） */
function backendToolsOf(contract: string): readonly string[] {
  return AGENT_TOOL_BACKEND[contract] ?? []
}

/** 写操作：必须经 dry-run 确认（方案 §12.4） */
export const WRITE_TOOLS: readonly string[] = [
  'createChannelPublishFlow',
  'publishChannelTaskNow',
  'cancelChannelPublishTask',
  'updateChannelPublishAt',
  'requestChannelPublishUpdate',
  'submitChannelEngagementComment',
  'callChannelEngagementFunction',
]

export type AgentToolProfile = 'core' | 'full'

export interface AgentToolSelection {
  profile: AgentToolProfile
  exposed: string[]
  hidden: string[]
  overBudget: boolean
}

export function isWriteTool(name: string): boolean {
  return WRITE_TOOLS.includes(name) || WRITE_CONTRACT_TOOLS.includes(name)
}

/** tools/list 出站过滤（nest-mcp MCP_TOOL_FILTER 适配）：Agent 面只暴露已实现契约对应的后端工具 */
export function agentCoreToolFilter(tools: Array<Pick<ResultTool, 'name'>>): ResultTool[] {
  const selection = selectAgentTools(tools.map(tool => tool.name), 'core')
  const exposedBackend = new Set(selection.exposed.flatMap(contract => backendToolsOf(contract)))
  return tools.filter(tool => exposedBackend.has(tool.name)) as ResultTool[]
}

/**
 * 按 profile 挑选对外暴露的工具：
 * - core（默认，Agent 面）：只暴露 AGENT_CORE_TOOLS 中真实存在的工具，且不超过 MAX_AGENT_TOOLS
 * - full：全部暴露，仅用于内部客户端或调试
 */
export function selectAgentTools(available: string[], profile: AgentToolProfile = 'core'): AgentToolSelection {
  const unique = Array.from(new Set(available))
  if (profile === 'full') {
    return {
      profile,
      exposed: unique,
      hidden: [],
      overBudget: unique.length > MAX_AGENT_TOOLS,
    }
  }
  const exposed = AGENT_CORE_TOOLS
    .filter(contract => backendToolsOf(contract).some(backend => unique.includes(backend)))
    .slice(0, MAX_AGENT_TOOLS)
  const exposedBackend = new Set(exposed.flatMap(contract => backendToolsOf(contract)))
  const hidden = unique.filter(name => !exposedBackend.has(name))
  return {
    profile,
    exposed,
    hidden,
    overBudget: exposed.length > MAX_AGENT_TOOLS,
  }
}
