import type { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { Context, Tool } from '@rekog/mcp-nest'
import { z } from 'zod'
import { CreatePublishingTaskDto, CreatePublishingTaskSchema } from '../publishing/dto/publishing.dto'
import { PublishingService } from '../publishing/publishing.service'
import { CreatePublishingTaskRespSchema, McpAuthedAccountsResponseSchema } from './dto/mcp.dto'

@Injectable()
export class PublishingTool {
  constructor(private readonly publishingService: PublishingService) {}
  @Tool({
    name: 'list_linked_accounts',
    description: 'List linked accounts',
    parameters: z.object({}).describe('无参数'),
    outputSchema: McpAuthedAccountsResponseSchema,
  })
  async listLinkedAccounts(_data: unknown, _ctx: Context, request: Request) {
    const apiKey = request.headers['api-key'] || request.query['api-key']
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('apiKey is required in header or query')
    }
    return await this.publishingService.listLinkedAccounts(apiKey)
  }

  @Tool({
    name: 'create_publishing_task',
    description: 'Create a publishing task',
    parameters: CreatePublishingTaskSchema,
    outputSchema: CreatePublishingTaskRespSchema,
  })
  async createPublishingTask(data: CreatePublishingTaskDto, request: Request) {
    const apiKey = request.headers['api-key'] || request.query['api-key']
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('apiKey is required in header or query')
    }
    return await this.publishingService.batchCreatePublishingTask(apiKey, data)
  }

//   @Tool({
//     name: 'update_publishing_time',
//     description: 'update publishing time',
//     parameters: UpdatePublishTaskTimeSchema,
//     outputSchema: UpdatePublishingTimeRespSchema,
//   })
//   async changeTaskTime(data: UpdatePublishTaskTimeDto) {
//     const res = await this.publishingService.updatePublishingTime(data)
//     return res
//   }
}
