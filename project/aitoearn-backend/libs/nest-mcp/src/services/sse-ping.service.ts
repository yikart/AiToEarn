import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { HttpResponse } from '../interfaces/http-adapter.interface'

/**
 * Service that implements automatic ping for SSE connections
 * This prevents browser/client timeouts for long-lived connections
 */
@Injectable()
export class SsePingService implements OnModuleInit, OnModuleDestroy {
  private pingInterval: NodeJS.Timeout | null = null
  private readonly logger = new Logger(SsePingService.name)
  private readonly activeConnections = new Map<
    string,
    {
      transport: SSEServerTransport
      res: HttpResponse
    }
  >()

  // Default to 30 seconds - this is a reasonable interval for most clients
  private pingIntervalMs = 30000

  constructor() {}

  onModuleInit() {
    this.logger.log('Initializing SSE ping service')
  }

  onModuleDestroy() {
    this.stopPingInterval()
    this.logger.log('SSE ping service stopped')
  }

  /**
   * Configure the ping service
   */
  configure(options: { pingEnabled?: boolean, pingIntervalMs?: number }) {
    if (options.pingIntervalMs !== undefined) {
      this.pingIntervalMs = options.pingIntervalMs
    }

    if (options.pingEnabled !== false) {
      this.startPingInterval()
    }
    else {
      this.stopPingInterval()
    }
  }

  /**
   * Register a new SSE connection to receive pings
   */
  registerConnection(
    sessionId: string,
    transport: SSEServerTransport,
    res: HttpResponse,
  ) {
    this.activeConnections.set(sessionId, { transport, res })
    this.logger.debug(`SSE connection registered: ${sessionId}`)
  }

  /**
   * Remove an SSE connection
   */
  removeConnection(sessionId: string) {
    this.activeConnections.delete(sessionId)
    this.logger.debug(`SSE connection removed: ${sessionId}`)
  }

  /**
   * Start the ping interval timer
   */
  private startPingInterval() {
    if (this.pingInterval) {
      this.stopPingInterval()
    }

    this.logger.log(
      `Starting SSE ping service (interval: ${this.pingIntervalMs}ms)`,
    )
    this.pingInterval = setInterval(() => {
      this.sendPingToAllConnections()
    }, this.pingIntervalMs)
  }

  /**
   * Stop the ping interval timer
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
      this.logger.log('SSE ping interval stopped')
    }
  }

  /**
   * Send a ping to all active connections
   */
  private sendPingToAllConnections() {
    const timestamp = Date.now()
    const connectionCount = this.activeConnections.size

    if (connectionCount === 0) {
      return
    }

    this.logger.debug(`Sending SSE ping to ${connectionCount} connections`)

    for (const [sessionId, { res }] of this.activeConnections.entries()) {
      try {
        // Send a comment-type SSE message (line starting with ':')
        // This keeps the connection alive without triggering an event in the client
        if (!res.closed && res.writable) {
          res.write(`: ping - ${new Date(timestamp).toISOString()}\n\n`)
        }
        else {
          this.logger.debug(
            `Connection ${sessionId} is no longer writable, removing`,
          )
          // TODO: After non writable connections are discovered it'd be useful to cleanup transports/mcp servers
          // for that connection in  sse.controller.factory.ts
          this.removeConnection(sessionId)
        }
      }
      catch (error) {
        this.logger.error(
          `Error sending ping to connection ${sessionId}`,
          error,
        )
        this.removeConnection(sessionId)
      }
    }
  }
}
