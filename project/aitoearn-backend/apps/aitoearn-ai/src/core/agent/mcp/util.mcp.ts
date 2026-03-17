import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { ContentGenerationTaskRepository } from '@yikart/mongodb'
import { Subject } from 'rxjs'
import { z } from 'zod'
import { McpServerName } from '../agent.constants'
import {
  AgentMessageType,
  ContentGenerationTaskResultSchema,
  ContentGenerationTaskTitleUpdatedChunkVo,
} from '../agent.vo'
import { successResult, wrapTool } from './mcp.utils'

export { ContentGenerationTaskResultSchema }

export enum TaskResultToolName {
  OutputTaskResult = 'outputTaskResult',
  SetTitle = 'setTitle',
}

export enum UtilToolName {
  GetCurrentTime = 'getCurrentTime',
  Wait = 'wait',
  OutputTaskResult = 'outputTaskResult',
  SetTitle = 'setTitle',
}

const getCurrentTimeSchema = z.object({})

const waitSchema = z.object({
  seconds: z.number().int().min(1).max(300),
})

@Injectable()
export class UtilMcp {
  private readonly logger = new Logger(UtilMcp.name)

  constructor(
    private readonly contentGenerateRepository: ContentGenerationTaskRepository,
  ) { }

  getCurrentTime = wrapTool(
    this.logger,
    UtilToolName.GetCurrentTime,
    'Get the current server time in ISO 8601 format with timezone information. No parameters required. Returns current timestamp.',
    getCurrentTimeSchema.shape,
    async () => {
      const now = new Date()
      const isoString = now.toISOString()
      return successResult(`Current time:\n- ISO 8601: ${isoString}`)
    },
  )

  wait = wrapTool(
    this.logger,
    UtilToolName.Wait,
    'Wait for a specified number of seconds before continuing. Use for controlling polling intervals for async tasks. Accepts seconds (1-300).',
    waitSchema.shape,
    async (args) => {
      const seconds = Math.min(args.seconds, 300)
      await new Promise(resolve => setTimeout(resolve, seconds * 1000))
      return successResult(`Waited for ${seconds} seconds`)
    },
  )

  createSetTitleTool(
    taskId: string,
  ) {
    const titleUpdateSubject = new Subject<ContentGenerationTaskTitleUpdatedChunkVo>()

    const setTitleTool = wrapTool(
      this.logger,
      UtilToolName.SetTitle,
      'Set conversation title',
      {
        title: z.string().max(30),
      },
      async (args) => {
        const title = args.title
        await this.contentGenerateRepository.updateById(taskId, {
          title,
        })
        this.logger.debug(`Title updated for task ${taskId}: ${title}`)
        titleUpdateSubject.next(ContentGenerationTaskTitleUpdatedChunkVo.create({
          type: AgentMessageType.TitleUpdated,
          taskId,
          title,
        }))
        return successResult('Title updated successfully')
      },
    )

    return [
      setTitleTool,
      titleUpdateSubject.asObservable(),
      () => titleUpdateSubject.complete(),
    ] as const
  }

  readonly server: McpSdkServerConfigWithInstance = createSdkMcpServer({
    name: McpServerName.Util,
    version: '1.0.0',
    tools: [
      this.wait,
      this.getCurrentTime,
    ],
  })
}
