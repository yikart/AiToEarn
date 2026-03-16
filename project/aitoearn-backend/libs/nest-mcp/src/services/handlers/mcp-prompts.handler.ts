import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  McpError,
  PromptArgument,
} from '@modelcontextprotocol/sdk/types.js'
import { Inject, Injectable, Scope } from '@nestjs/common'
import { ContextIdFactory, ModuleRef } from '@nestjs/core'
import { getErrorMessage } from '@yikart/common'
import { HttpRequest } from '../../interfaces/http-adapter.interface'
import { McpRegistryService } from '../mcp-registry.service'
import { McpHandlerBase } from './mcp-handler.base'

@Injectable({ scope: Scope.REQUEST })
export class McpPromptsHandler extends McpHandlerBase {
  constructor(
    moduleRef: ModuleRef,
    registry: McpRegistryService,
    @Inject('MCP_MODULE_ID') private readonly mcpModuleId: string,
  ) {
    super(moduleRef, registry, McpPromptsHandler.name)
  }

  registerHandlers(mcpServer: McpServer, httpRequest: HttpRequest) {
    if (this.registry.getPrompts(this.mcpModuleId).length === 0) {
      this.logger.debug('No prompts registered, skipping prompt handlers')
      return
    }
    mcpServer.server.setRequestHandler(ListPromptsRequestSchema, () => {
      this.logger.debug('ListPromptsRequestSchema is being called')

      const prompts = this.registry
        .getPrompts(this.mcpModuleId)
        .map(prompt => ({
          name: prompt.metadata.name,
          description: prompt.metadata.description,
          arguments: prompt.metadata.parameters
            ? Object.entries(prompt.metadata.parameters.shape).map(
                ([name, field]): PromptArgument => ({
                  name,
                  description: field.description,
                  required: !field.isOptional(),
                }),
              )
            : [],
        }))

      return {
        prompts,
      }
    })

    mcpServer.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request) => {
        this.logger.debug('GetPromptRequestSchema is being called')

        try {
          const name = request.params.name
          const promptInfo = this.registry.findPrompt(this.mcpModuleId, name)

          if (!promptInfo) {
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown prompt: ${name}`,
            )
          }

          const contextId = ContextIdFactory.getByRequest(httpRequest)
          this.moduleRef.registerRequestByContextId(httpRequest, contextId)

          const promptInstance = await this.moduleRef.resolve(
            promptInfo.providerClass,
            contextId,
            { strict: false },
          )

          if (!promptInstance) {
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown prompt: ${name}`,
            )
          }

          const context = this.createContext(mcpServer, request)
          const methodName = promptInfo.methodName

          const result = await promptInstance[methodName](
            request.params.arguments,
            context,
            httpRequest.raw,
          )

          this.logger.debug(result, 'GetPromptRequestSchema result')

          return result
        }
        catch (error) {
          this.logger.error(error)
          const errorMessage = getErrorMessage(error)
          return {
            contents: [{ mimeType: 'text/plain', text: errorMessage }],
            isError: true,
          }
        }
      },
    )
  }
}
