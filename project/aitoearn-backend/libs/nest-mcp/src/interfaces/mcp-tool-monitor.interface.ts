export interface McpToolMonitor {
  onToolSuccess: (toolName: string) => Promise<void>
  onToolError: (toolName: string, error: unknown) => Promise<void>
}

export const MCP_TOOL_MONITOR = Symbol('MCP_TOOL_MONITOR')
