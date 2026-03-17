import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ContextIdFactory, ModuleRef } from '@nestjs/core'
import { HttpAdapterFactory } from '../adapters/http-adapter.factory'
import { McpOptions } from '../interfaces'
import {
  HttpRequest,
  HttpResponse,
} from '../interfaces/http-adapter.interface'
import { buildMcpCapabilities } from '../utils/capabilities-builder'
import { McpExecutorService } from './mcp-executor.service'
import { McpRegistryService } from './mcp-registry.service'

@Injectable()
export class McpStreamableHttpService implements OnModuleDestroy {
  private readonly logger = new Logger(McpStreamableHttpService.name)
  private readonly transports: {
    [sessionId: string]: StreamableHTTPServerTransport
  } = {}

  private readonly mcpServers: { [sessionId: string]: McpServer } = {}
  private readonly executors: { [sessionId: string]: McpExecutorService } = {}
  private readonly isStatelessMode: boolean

  constructor(
    @Inject('MCP_OPTIONS') private readonly options: McpOptions,
    @Inject('MCP_MODULE_ID') private readonly mcpModuleId: string,
    private readonly moduleRef: ModuleRef,
    private readonly toolRegistry: McpRegistryService,
  ) {
    // Determine if we're in stateless mode
    this.isStatelessMode = !!options.streamableHttp?.statelessMode
  }

  /**
   * Create a new MCP server instance for stateless requests
   */
  async createStatelessServer(rawReq: any): Promise<{
    server: McpServer
    transport: StreamableHTTPServerTransport
  }> {
    // Create a new transport for this request (stateless = no session management)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse:
        this.options.streamableHttp?.enableJsonResponse || false,
    })

    // Create a new MCP server instance with dynamic capabilities
    const capabilities = buildMcpCapabilities(
      this.mcpModuleId,
      this.toolRegistry,
      this.options,
    )
    this.logger.debug(
      `[Stateless] Built MCP capabilities: ${JSON.stringify(capabilities)}`,
    )

    const server = new McpServer(
      { name: this.options.name, version: this.options.version },
      {
        capabilities,
        instructions: this.options.instructions || '',
      },
    )

    // Connect the transport to the MCP server first
    await server.connect(transport)

    // Now resolve the request-scoped tool executor service
    const contextId = ContextIdFactory.getByRequest(rawReq)
    const executor = await this.moduleRef.resolve(
      McpExecutorService,
      contextId,
      { strict: true },
    )

    // Register request handlers after connection
    this.logger.debug(
      '[Stateless] Registering request handlers for stateless MCP server',
    )
    executor.registerRequestHandlers(server, rawReq)

    return { server, transport }
  }

  /**
   * Handle POST requests
   */
  async handlePostRequest(req: any, res: any, body: unknown): Promise<void> {
    // Get the appropriate HTTP adapter for the request/response
    const adapter = HttpAdapterFactory.getAdapter(req, res)
    const adaptedReq = adapter.adaptRequest(req)
    const adaptedRes = adapter.adaptResponse(res)
    const sessionId = adaptedReq.headers['mcp-session-id'] as
      | string
      | undefined

    this.logger.debug(
      `[${sessionId || 'No-Session'}] Received MCP request: ${JSON.stringify(body)}`,
    )

    try {
      if (this.isStatelessMode) {
        return this.handleStatelessRequest(adaptedReq, adaptedRes, body)
      }
      else {
        return this.handleStatefulRequest(adaptedReq, adaptedRes, body)
      }
    }
    catch (error) {
      this.logger.error(
        `[${sessionId || 'No-Session'}] Error handling MCP request: ${error}`,
      )
      if (!adaptedRes.headersSent) {
        adaptedRes.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        })
      }
    }
  }

  /**
   * Handle requests in stateless mode
   */
  async handleStatelessRequest(
    req: any,
    res: HttpResponse,
    body: unknown,
  ): Promise<void> {
    this.logger.debug(
      `[Stateless] Handling stateless MCP request at ${req.url}`,
    )

    let server: McpServer | null = null
    let transport: StreamableHTTPServerTransport | null = null

    try {
      // Create a new server and transport for each request
      const stateless = await this.createStatelessServer(req)
      server = stateless.server
      transport = stateless.transport

      // Handle the request
      await transport.handleRequest(req.raw, res.raw, body)

      // Clean up after response is sent
      res.raw.on('finish', async () => {
        this.logger.debug('[Stateless] Response sent, cleaning up')
        try {
          if (transport)
            await transport.close()
          if (server)
            await server.close()
        }
        catch (error) {
          this.logger.error('[Stateless] Error cleaning up:', error)
        }
      })
    }
    catch (error) {
      this.logger.error(
        `[Stateless] Error in stateless request handling: ${error}`,
      )
      // Clean up on error
      try {
        if (transport)
          await transport.close()
        if (server)
          await server.close()
      }
      catch (error) {
        this.logger.error('[Stateless] Error cleaning up on error:', error)
      }
      throw error
    }
  }

  /**
   * Handle requests in stateful mode
   */
  async handleStatefulRequest(
    req: HttpRequest,
    res: HttpResponse,
    body: unknown,
  ): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined

    this.logger.debug(`[${sessionId || 'New'}] Handling stateful MCP request`)

    // Case 1: New initialization request
    if (!sessionId && this.isInitializeRequest(body)) {
      // Validate it's not a batch with multiple requests
      if (Array.isArray(body) && body.length > 1) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message:
              'Invalid Request: Only one initialization request is allowed',
          },
          id: null,
        })
        return
      }

      // Build capabilities
      const capabilities = buildMcpCapabilities(
        this.mcpModuleId,
        this.toolRegistry,
        this.options,
      )

      // Create MCP server
      const mcpServer = new McpServer(
        { name: this.options.name, version: this.options.version },
        {
          capabilities,
          instructions: this.options.instructions || '',
        },
      )

      // Create transport with session management
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator:
          this.options.streamableHttp?.sessionIdGenerator
          || (() => randomUUID()),
        enableJsonResponse:
          this.options.streamableHttp?.enableJsonResponse || false,
        onsessioninitialized: async (sid: string) => {
          this.logger.debug(`[${sid}] Session initialized, storing references`)
          // Store all session data
          this.transports[sid] = transport
          this.mcpServers[sid] = mcpServer

          // Resolve and store the executor for this session
          const contextId = ContextIdFactory.getByRequest(req)
          const executor = await this.moduleRef.resolve(
            McpExecutorService,
            contextId,
            { strict: true },
          )
          this.executors[sid] = executor

          // Register request handlers ONCE during initialization
          executor.registerRequestHandlers(mcpServer, req)
        },
        onsessionclosed: async (sid: string) => {
          this.logger.debug(`[${sid}] Session closed via DELETE`)
          await this.cleanupSession(sid)
        },
      })

      // Connect transport to server
      await mcpServer.connect(transport)

      // Handle the initialization request
      await transport.handleRequest(req.raw, res.raw, body)

      this.logger.log(`[${transport.sessionId}] New session initialized`)
      return
    }

    // Case 2: Request with session ID
    if (sessionId) {
      // Check if session exists
      if (!this.transports[sessionId]) {
        this.logger.debug(`[${sessionId}] Session not found`)
        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Session not found',
          },
          id: null,
        })
        return
      }

      // Reject re-initialization attempts
      if (this.isInitializeRequest(body)) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: Server already initialized',
          },
          id: null,
        })
        return
      }

      // Use existing transport
      const transport = this.transports[sessionId]

      this.logger.debug(
        `[${sessionId}] Handling request with existing session`,
      )

      // Handle the request with existing transport and handlers
      await transport.handleRequest(req.raw, res.raw, body)
      return
    }

    // Case 3: No session ID and not initialization
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Mcp-Session-Id header is required',
      },
      id: null,
    })
  }

  /**
   * Handle GET requests for SSE streams
   */
  async handleGetRequest(req: any, res: any): Promise<void> {
    const adapter = HttpAdapterFactory.getAdapter(req, res)
    const adaptedReq = adapter.adaptRequest(req)
    const adaptedRes = adapter.adaptResponse(res)

    if (this.isStatelessMode) {
      adaptedRes.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed in stateless mode',
        },
        id: null,
      })
      return
    }

    const sessionId = adaptedReq.headers['mcp-session-id'] as
      | string
      | undefined

    if (!sessionId) {
      adaptedRes.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Mcp-Session-Id header is required',
        },
        id: null,
      })
      return
    }

    if (!this.transports[sessionId]) {
      this.logger.debug(`[${sessionId}] GET request - session not found`)
      adaptedRes.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found',
        },
        id: null,
      })
      return
    }

    this.logger.debug(`[${sessionId}] Establishing SSE stream`)
    const transport = this.transports[sessionId]
    await transport.handleRequest(adaptedReq.raw, adaptedRes.raw)
  }

  /**
   * Handle DELETE requests for terminating sessions
   */
  async handleDeleteRequest(req: any, res: any): Promise<void> {
    const adapter = HttpAdapterFactory.getAdapter(req, res)
    const adaptedReq = adapter.adaptRequest(req)
    const adaptedRes = adapter.adaptResponse(res)

    if (this.isStatelessMode) {
      adaptedRes.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed in stateless mode',
        },
        id: null,
      })
      return
    }

    const sessionId = adaptedReq.headers['mcp-session-id'] as
      | string
      | undefined

    if (!sessionId) {
      adaptedRes.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Mcp-Session-Id header is required',
        },
        id: null,
      })
      return
    }

    if (!this.transports[sessionId]) {
      this.logger.debug(`[${sessionId}] DELETE request - session not found`)
      adaptedRes.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found',
        },
        id: null,
      })
      return
    }

    this.logger.debug(`[${sessionId}] Processing DELETE request`)
    const transport = this.transports[sessionId]

    // Let transport handle the DELETE request
    // The onsessionclosed callback will handle cleanup
    await transport.handleRequest(adaptedReq.raw, adaptedRes.raw)
  }

  /**
   * Helper function to detect initialize requests
   */
  private isInitializeRequest(body: unknown): boolean {
    if (Array.isArray(body)) {
      return body.some(
        msg =>
          typeof msg === 'object'
          && msg !== null
          && 'method' in msg
          && msg.method === 'initialize',
      )
    }
    return (
      typeof body === 'object'
      && body !== null
      && 'method' in body
      && (body as Record<string, unknown>)['method'] === 'initialize'
    )
  }

  /**
   * Clean up session resources
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    if (!sessionId || !this.transports[sessionId]) {
      return
    }

    this.logger.debug(`[${sessionId}] Cleaning up session`)

    try {
      // Close transport if still open
      const transport = this.transports[sessionId]
      if (transport) {
        await transport.close()
      }

      // Close MCP server
      const server = this.mcpServers[sessionId]
      if (server) {
        await server.close()
      }

      // Clean up all references
      delete this.transports[sessionId]
      delete this.mcpServers[sessionId]
      delete this.executors[sessionId]
    }
    catch (error) {
      this.logger.error(`[${sessionId}] Error during cleanup:`, error)
    }
  }

  /**
   * Clean up all sessions on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up all MCP sessions...')
    const sessionIds = Object.keys(this.transports)

    await Promise.all(
      sessionIds.map(sessionId => this.cleanupSession(sessionId)),
    )

    this.logger.log(`Cleaned up ${sessionIds.length} MCP sessions`)
  }
}
