import { Controller } from '@nestjs/common'
import { Prompt, PromptOptions, Tool, ToolOptions } from '@rekog/mcp-nest'
import { AppException, ResponseCode } from '@yikart/common'
import { Request } from 'express'
import { z } from 'zod'
import { CreatePublishingTaskRespSchema, McpAuthedAccountsResponseSchema, McpPromptPublishSchema, UpdatePublishingTimeRespSchema, UpdatePublishTaskTimeDto, UpdatePublishTaskTimeSchema } from './dto/mcp.dto'
import { CreatePublishingTaskDto, CreatePublishingTaskSchema } from './dto/publish.dto'
import { McpService } from './mcp.service'

@Controller()
export class McpController {
  constructor(
    private readonly mcpService: McpService,
  ) { }

  @Prompt({
    name: 'generate_publishing_prompt',
    description: 'Generate a publishing prompt',
    parameters: McpPromptPublishSchema as unknown as PromptOptions['parameters'],
  })
  async generatePublishingPrompt() {
    return this.mcpService.generatePublishingPrompt()
  }

  @Tool({
    name: 'list_linked_accounts',
    description: 'List linked accounts',
    parameters: z.object({}).describe('无参数'),
    outputSchema: McpAuthedAccountsResponseSchema as unknown as ToolOptions['outputSchema'],
  })
  async listLinkedAccounts(request: Request) {
    const skKey = request.headers['sk-key'] || request.query['sk-key']
    if (!skKey || typeof skKey !== 'string') {
      throw new AppException(ResponseCode.ChannelSkKeyRequired)
    }
    return await this.mcpService.listLinkedAccounts(skKey)
  }

  @Tool({
    name: 'create_publishing_task',
    description: 'Create a publishing task',
    parameters: CreatePublishingTaskSchema,
    outputSchema: CreatePublishingTaskRespSchema as unknown as ToolOptions['outputSchema'],
  })
  async createPublishingTask(data: CreatePublishingTaskDto, request: Request) {
    const skKey = request.headers['sk-key'] || request.query['sk-key']
    if (!skKey || typeof skKey !== 'string') {
      throw new AppException(ResponseCode.ChannelSkKeyRequired)
    }
    return await this.mcpService.bulkCreatePublishingTask(skKey, data)
  }

  @Tool({
    name: 'update_publishing_time',
    description: 'update publishing time',
    parameters: UpdatePublishTaskTimeSchema as unknown as ToolOptions['parameters'],
    outputSchema: UpdatePublishingTimeRespSchema as unknown as ToolOptions['outputSchema'],
  })
  async changeTaskTime(data: UpdatePublishTaskTimeDto) {
    const res = await this.mcpService.updatePublishingTime(data)
    return res
  }
}
