import type { z } from 'zod'
import { Injectable } from '@nestjs/common'
import { getUser, toTextResult, toYamlTextResult } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import {
  createInteractionRecordSchema,
  deleteInteractionRecordSchema,
  listInteractionRecordsSchema,
} from './interaction-mcp.schema'
import { InteractionMcpService } from './interaction-mcp.service'

@Injectable()
export class InteractionMcpController {
  constructor(
    private readonly interactionMcpService: InteractionMcpService,
  ) {}

  @Tool({
    name: 'createInteractionRecord',
    description: 'Create an interaction evidence record for the authenticated user. Side Effect: yes.',
    parameters: createInteractionRecordSchema,
  })
  async createInteractionRecord(params: z.infer<typeof createInteractionRecordSchema>) {
    const user = getUser()
    return toTextResult(await this.interactionMcpService.createInteractionRecord(user.id, params))
  }

  @Tool({
    name: 'listInteractionRecords',
    description: 'List interaction evidence records for the authenticated user.',
    parameters: listInteractionRecordsSchema,
  })
  async listInteractionRecords(params: z.infer<typeof listInteractionRecordsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.interactionMcpService.listInteractionRecords(user.id, params))
  }

  @Tool({
    name: 'deleteInteractionRecord',
    description: 'Delete an interaction evidence record by ID. Side Effect: yes.',
    parameters: deleteInteractionRecordSchema,
  })
  async deleteInteractionRecord(params: z.infer<typeof deleteInteractionRecordSchema>) {
    const user = getUser()
    return toTextResult(await this.interactionMcpService.deleteInteractionRecord(user.id, params))
  }
}
