import type { ResultTool } from './mcp-tool.interface'

/**
 * tools/list 出站过滤器：ListTools 响应发出前对工具列表做最终裁剪，
 * 用于 Agent 面工具预算控制（如只暴露已实现的核心契约工具）。
 *
 * 契约约束：filterTools 只能依赖工具的 name 字段做判定——
 * CallTool 拦截路径只会构造仅有 name 的桩对象传给过滤器。
 */
export interface McpToolFilter {
  filterTools: (tools: ResultTool[]) => ResultTool[]
}

export const MCP_TOOL_FILTER = Symbol('MCP_TOOL_FILTER')

export const IDENTITY_TOOL_FILTER: McpToolFilter = {
  filterTools: tools => tools,
}
