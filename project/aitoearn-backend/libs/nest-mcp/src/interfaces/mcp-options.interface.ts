import { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js'
import { CanActivate, ModuleMetadata, Type } from '@nestjs/common'

export enum McpTransportType {
  SSE = 'sse',
  STREAMABLE_HTTP = 'streamable-http',
  STDIO = 'stdio',
}

export interface McpOptions {
  // When and if, additional properties are introduced in ServerOptions or ServerInfo,
  // consider deprecating these fields in favor of using ServerOptions and ServerInfo directly.
  name: string
  version: string
  capabilities?: ServerCapabilities
  instructions?: string

  transport?: McpTransportType | McpTransportType[]
  sseEndpoint?: string
  messagesEndpoint?: string
  mcpEndpoint?: string
  /**
   * @deprecated Use `app.setGlobalPrefix()` for global api prefix. Use apiPrefix to attach a prefix to the handshake.
   */
  globalApiPrefix?: never
  apiPrefix?: string
  guards?: Type<CanActivate>[]
  decorators?: ClassDecorator[]
  sse?: {
    pingEnabled?: boolean
    pingIntervalMs?: number
  }
  streamableHttp?: {
    enableJsonResponse?: boolean
    sessionIdGenerator?: () => string
    /**
     * @experimental: The current implementation does not fully comply with the MCP Specification.
     */
    statelessMode?: boolean
  }
}

// Async variant omits transport since controllers are not auto-registered in forRootAsync
export type McpAsyncOptions = Omit<McpOptions, 'transport'>

export interface McpOptionsFactory {
  createMcpOptions: () => Promise<McpAsyncOptions> | McpAsyncOptions
}

export interface McpModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<McpOptionsFactory>
  useClass?: Type<McpOptionsFactory>
  useFactory?: (...args: any[]) => Promise<McpAsyncOptions> | McpAsyncOptions
  inject?: any[]
  extraProviders?: any[] // allow user to provide additional providers in async mode
}
