import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ApplicationConfig, ContextIdFactory, ModuleRef } from '@nestjs/core'
import { HttpAdapterFactory } from '../adapters'
import { McpOptions } from '../interfaces'
import { buildMcpCapabilities } from '../utils/capabilities-builder'
import { normalizeEndpoint } from '../utils/normalize-endpoint'
import { McpExecutorService } from './mcp-executor.service'
import { McpRegistryService } from './mcp-registry.service'
import { SsePingService } from './sse-ping.service'

@Injectable()
export class McpSseService {
  private readonly logger = new Logger(McpSseService.name)

  // Note: Currently, storing transports and servers makes it a requirement to have sticky sessions.

  // Map to store active transports by session ID
  private readonly transports = new Map<string, SSEServerTransport>()
  // Map to store MCP server instances by session ID
  private readonly mcpServers = new Map<string, McpServer>()

  constructor(
    @Inject('MCP_OPTIONS') private readonly options: McpOptions,
    @Inject('MCP_MODULE_ID') private readonly mcpModuleId: string,
    private readonly applicationConfig: ApplicationConfig,
    private readonly moduleRef: ModuleRef,
    private readonly toolRegistry: McpRegistryService,
    @Inject(SsePingService) private readonly pingService: SsePingService,
  ) {}

  /**
   * Initialize the SSE service and configure ping service
   */
  initialize() {
    // Configure ping service with options
    this.pingService.configure({
      pingEnabled: this.options.sse?.pingEnabled, // Enable by default
      pingIntervalMs: this.options.sse?.pingIntervalMs,
    })
  }

  /**
   * Create and manage SSE connection
   */
  async createSseConnection(
    rawReq: any,
    rawRes: any,
    messagesEndpoint: string,
    apiPrefix: string,
  ): Promise<void> {
    const adapter = HttpAdapterFactory.getAdapter(rawReq, rawRes)
    const res = adapter.adaptResponse(rawRes)

    // Create a new SSE transport instance
    const transport = new SSEServerTransport(
      normalizeEndpoint(
        `${apiPrefix}/${this.applicationConfig.getGlobalPrefix()}/${messagesEndpoint}`,
      ),
      res.raw,
    )
    const sessionId = transport.sessionId

    // Create a new MCP server instance with dynamic capabilities
    const capabilities = buildMcpCapabilities(
      this.mcpModuleId,
      this.toolRegistry,
      this.options,
    )
    this.logger.debug('Built MCP capabilities:', capabilities)

    // Create a new MCP server for this session with dynamic capabilities
    const mcpServer = new McpServer(
      { name: this.options.name, version: this.options.version },
      {
        capabilities,
        instructions: this.options.instructions || '',
      },
    )

    // Store the transport and server for this session
    this.transports.set(sessionId, transport)
    this.mcpServers.set(sessionId, mcpServer)

    // Register the connection with the ping service
    this.pingService.registerConnection(sessionId, transport, res)

    transport.onclose = () => {
      // Clean up when the connection closes
      this.transports.delete(sessionId)
      this.mcpServers.delete(sessionId)
      this.pingService.removeConnection(sessionId)
    }

    await mcpServer.connect(transport)
  }

  /**
   * Handle message processing for SSE
   */
  async handleMessage(rawReq: any, rawRes: any, body: unknown): Promise<any> {
    const adapter = HttpAdapterFactory.getAdapter(rawReq, rawRes)
    const req = adapter.adaptRequest(rawReq)
    const res = adapter.adaptResponse(rawRes)
    const sessionId = req.query['sessionId'] as string
    const transport = this.transports.get(sessionId)

    if (!transport) {
      return res.status(404).send('Session not found')
    }

    const mcpServer = this.mcpServers.get(sessionId)
    if (!mcpServer) {
      return res.status(404).send('MCP server not found for session')
    }

    // Resolve the request-scoped tool executor service
    const contextId = ContextIdFactory.getByRequest(req)
    const executor = await this.moduleRef.resolve(
      McpExecutorService,
      contextId,
    )

    // Register request handlers with the user context from this specific request
    executor.registerRequestHandlers(mcpServer, req)

    // Process the message
    await transport.handlePostMessage(req.raw, res.raw, body)
  }
}
