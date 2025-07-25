import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Provider } from '@nestjs/common'
import { MCP_CLIENT, MCP_OPTIONS } from './constants'
import { McpModuleOptions } from './mcp.interface'

export function createMcpClientProvider(): Provider {
  return {
    provide: MCP_CLIENT,
    useFactory: async (options: McpModuleOptions) => {
      const transport = new StreamableHTTPClientTransport(
        new URL(options.url),
        options,
      )

      const client = new Client({
        name: 'channel-mcp-server',
        version: '1.0.0',
      })

      await client.connect(transport)

      return client
    },
    inject: [MCP_OPTIONS],
  }
}

export const mcpProviders = [createMcpClientProvider()]
