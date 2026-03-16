import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Inject, Injectable, InjectionToken, Scope } from '@nestjs/common'
import { ContextIdFactory, ModuleRef } from '@nestjs/core'
import { getErrorMessage } from '@yikart/common'
import { Context } from '../../interfaces'
import { HttpRequest } from '../../interfaces/http-adapter.interface'
import { McpRegistryService } from '../mcp-registry.service'
import { McpHandlerBase } from './mcp-handler.base'

@Injectable({ scope: Scope.REQUEST })
export class McpResourcesHandler extends McpHandlerBase {
  constructor(
    moduleRef: ModuleRef,
    registry: McpRegistryService,
    @Inject('MCP_MODULE_ID') private readonly mcpModuleId: string,
  ) {
    super(moduleRef, registry, McpResourcesHandler.name)
  }

  registerHandlers(mcpServer: McpServer, httpRequest: HttpRequest) {
    const resources = this.registry.getResources(this.mcpModuleId)
    const resourceTemplates = this.registry.getResourceTemplates(
      this.mcpModuleId,
    )
    if (resources.length === 0 && resourceTemplates.length === 0) {
      this.logger.debug(
        'No resources or resource templates registered, skipping resource handlers',
      )
      return
    }

    mcpServer.server.setRequestHandler(ListResourcesRequestSchema, () => {
      this.logger.debug('ListResourcesRequestSchema is being called')
      return {
        resources: this.registry
          .getResources(this.mcpModuleId)
          .map(resources => resources.metadata),
      }
    })

    mcpServer.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      () => {
        this.logger.debug('ListResourceTemplatesRequestSchema is being called')
        return {
          resourceTemplates: this.registry
            .getResourceTemplates(this.mcpModuleId)
            .map(resourceTemplate => resourceTemplate.metadata),
        }
      },
    )

    mcpServer.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        this.logger.debug('ReadResourceRequestSchema is being called')

        const uri = request.params.uri
        const resourceInfo = this.registry.findResourceByUri(
          this.mcpModuleId,
          uri,
        )
        const resourceTemplateInfo = this.registry.findResourceTemplateByUri(
          this.mcpModuleId,
          uri,
        )

        try {
          let providerClass: InjectionToken
          let params: Record<string, unknown> = {}
          let methodName: string
          if (resourceTemplateInfo) {
            providerClass = resourceTemplateInfo.resourceTemplate.providerClass
            params = {
              ...resourceTemplateInfo.params,
              ...request.params,
            }
            methodName = resourceTemplateInfo.resourceTemplate.methodName
          }
          else if (resourceInfo) {
            providerClass = resourceInfo.resource.providerClass

            params = {
              ...resourceInfo.params,
              ...request.params,
            }
            methodName = resourceInfo.resource.methodName
          }
          else {
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown resource: ${uri}`,
            )
          }
          return await this.handleRequest(
            httpRequest,
            providerClass,
            uri,
            this.createContext(mcpServer, request),
            params,
            methodName,
          )
        }
        catch (error) {
          this.logger.error(error)
          const errorMessage = getErrorMessage(error)
          return {
            contents: [{ uri, mimeType: 'text/plain', text: errorMessage }],
            isError: true,
          }
        }
      },
    )
  }

  private async handleRequest(
    httpRequest: HttpRequest,
    providerClass: InjectionToken,
    uri: string,
    context: Context,
    requestParams: Record<string, unknown>,
    methodName: string,
  ) {
    const contextId = ContextIdFactory.getByRequest(httpRequest)
    this.moduleRef.registerRequestByContextId(httpRequest, contextId)

    const resourceInstance = await this.moduleRef.resolve(
      providerClass,
      contextId,
      { strict: false },
    )

    if (!resourceInstance) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown resource template: ${uri}`,
      )
    }
    const result = await resourceInstance[methodName](
      requestParams,
      context,
      httpRequest,
    )

    this.logger.debug(result, 'ReadResourceRequestSchema result')

    return result
  }
}
