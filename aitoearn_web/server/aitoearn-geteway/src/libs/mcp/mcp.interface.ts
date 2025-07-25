import { StreamableHTTPClientTransportOptions } from '@modelcontextprotocol/sdk/client/streamableHttp'

export interface McpModuleOptions extends StreamableHTTPClientTransportOptions {
  url: string
  isGlobal?: boolean
}
