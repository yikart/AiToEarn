import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Progress } from '@modelcontextprotocol/sdk/types.js'
import { Logger } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Context, McpRequest, SerializableValue } from '../../interfaces'
import { McpRegistryService } from '../mcp-registry.service'

export abstract class McpHandlerBase {
  protected logger: Logger

  constructor(
    protected readonly moduleRef: ModuleRef,
    protected readonly registry: McpRegistryService,
    loggerContext: string,
  ) {
    this.logger = new Logger(loggerContext)
  }

  protected createContext(
    mcpServer: McpServer,
    mcpRequest: McpRequest,
  ): Context {
    // handless stateless traffic where notifications and progress are not supported
    if (mcpServer.server.transport?.sessionId === undefined) {
      return this.createStatelessContext(mcpServer, mcpRequest)
    }

    const progressToken = mcpRequest.params?._meta?.progressToken
    return {
      reportProgress: async (progress: Progress) => {
        if (progressToken) {
          await mcpServer.server.notification({
            method: 'notifications/progress',
            params: {
              ...progress,
              progressToken,
            } as Progress,
          })
        }
      },
      log: {
        debug: (message: string, context?: SerializableValue) => {
          void mcpServer.server.sendLoggingMessage({
            level: 'debug',
            data: { message, context },
          })
        },
        error: (message: string, context?: SerializableValue) => {
          void mcpServer.server.sendLoggingMessage({
            level: 'error',
            data: { message, context },
          })
        },
        info: (message: string, context?: SerializableValue) => {
          void mcpServer.server.sendLoggingMessage({
            level: 'info',
            data: { message, context },
          })
        },
        warn: (message: string, context?: SerializableValue) => {
          void mcpServer.server.sendLoggingMessage({
            level: 'warning',
            data: { message, context },
          })
        },
      },
      mcpServer,
      mcpRequest,
    }
  }

  protected createStatelessContext(
    mcpServer: McpServer,
    mcpRequest: McpRequest,
  ): Context {
    const warn = (fn: string) => {
      this.logger.warn(`Stateless context: '${fn}' is not supported.`)
    }
    return {
      reportProgress: async (_progress: Progress) => {
        warn('reportProgress not supported in stateless')
      },
      log: {
        debug: (_message: string, _data?: SerializableValue) => {
          warn('server report logging not supported in stateless')
        },
        error: (_message: string, _data?: SerializableValue) => {
          warn('server report logging not supported in stateless')
        },
        info: (_message: string, _data?: SerializableValue) => {
          warn('server report logging not supported in stateless')
        },
        warn: (_message: string, _data?: SerializableValue) => {
          warn('server report logging not supported in stateless')
        },
      },
      mcpServer,
      mcpRequest,
    }
  }
}
