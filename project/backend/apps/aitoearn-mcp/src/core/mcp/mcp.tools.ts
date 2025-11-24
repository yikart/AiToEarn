import type { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { Context, Tool } from '@rekog/mcp-nest'
import { z } from 'zod'
import { PublishingService } from '../publishing/publishing.service'

@Injectable()
export class PublishingTool {
  constructor(private readonly publishingService: PublishingService) {}
  @Tool({
    name: 'list-linked-accounts',
    description: 'List linked accounts',
    parameters: z.object({}),
    outputSchema: z.object({}),
  })
  async listLinkedAccounts({ name }: { name: string }, _ctx: Context, request: Request) {
    const apiKey = request.headers['x-api-key'] || request.query['x-api-key']
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error(`apiKey is required in header or query ${name}`)
    }
    const accounts = await this.publishingService.listLinkedAccounts(apiKey)
    return {
      accounts: accounts.map(account => ({
        accountId: account._id.toString(),
        userId: account.userId,
        platform: account.type,
        nickname: account.nickname,
      })),
    }
  }

  @Tool({
    name: 'create-publishing-task',
    description: 'Create a publishing task',
    parameters: z.object({}),
    outputSchema: z.object({}),
  })
  async createPublishingTask(data: any, _ctx: Context, _request: Request) {
    return await this.publishingService.batchCreatePublishingTask('', data)
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
