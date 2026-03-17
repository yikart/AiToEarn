import {
  applyDecorators,
  Body,
  CanActivate,
  Controller,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Post,
  Req,
  Res,
  Type,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common'

import { McpOptions } from '../interfaces'
import { McpSseService } from '../services/mcp-sse.service'
import { normalizeEndpoint } from '../utils/normalize-endpoint'

/**
 * Creates a controller for handling SSE connections and tool executions
 */
export function createSseController(
  sseEndpoint: string,
  messagesEndpoint: string,
  apiPrefix: string,
  guards: Type<CanActivate>[] = [],
  decorators: ClassDecorator[] = [],
) {
  @Controller({
    version: VERSION_NEUTRAL,
  })
  @applyDecorators(...decorators)
  class SseController implements OnModuleInit {
    readonly logger = new Logger(SseController.name)

    constructor(
      @Inject('MCP_OPTIONS') public readonly options: McpOptions,
      public readonly mcpSseService: McpSseService,
    ) {}

    /**
     * Initialize the controller and configure SSE service
     */
    onModuleInit() {
      this.mcpSseService.initialize()
    }

    /**
     * SSE connection endpoint
     */
    @Get(normalizeEndpoint(`${apiPrefix}/${sseEndpoint}`))
    @UseGuards(...guards)
    async sse(@Req() rawReq: any, @Res() rawRes: any) {
      return this.mcpSseService.createSseConnection(
        rawReq,
        rawRes,
        messagesEndpoint,
        apiPrefix,
      )
    }

    /**
     * Tool execution endpoint - protected by the provided guards
     */
    @Post(normalizeEndpoint(`${apiPrefix}/${messagesEndpoint}`))
    @UseGuards(...guards)
    async messages(
      @Req() rawReq: any,
      @Res() rawRes: any,
      @Body() body: unknown,
    ): Promise<void> {
      await this.mcpSseService.handleMessage(rawReq, rawRes, body)
    }
  }

  return SseController
}
