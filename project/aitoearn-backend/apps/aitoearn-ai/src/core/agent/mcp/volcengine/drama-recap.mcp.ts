import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { z } from 'zod'
import { DramaRecapService } from '../../../ai/aideo'
import { DramaRecapTaskStatus } from '../../../ai/libs/volcengine'
import { McpServerName } from '../../agent.constants'
import { errorResult, successResult, wrapTool } from '../mcp.utils'

const submitDramaRecapTaskSchema = z.object({
  vids: z.array(z.string()),
  dramaScriptTaskId: z.string().optional(),
  recapText: z.string().optional(),
  speakerConfig: z.object({
    appId: z.string(),
    cluster: z.string(),
    voiceType: z.string(),
  }).optional(),
  isEraseSubtitle: z.boolean().optional(),
  fontConfig: z.object({
    color: z.string().optional(),
    size: z.number().optional(),
    name: z.string().optional(),
  }).optional(),
  recapStyle: z.string().optional(),
  recapTextSpeed: z.number().min(0.5).max(2.0).optional(),
  recapTextLength: z.number().max(5000).optional(),
  pauseTime: z.number().min(1).max(1000).optional(),
  allowRepeatMatch: z.boolean().optional(),
  batchGenerateCount: z.number().min(1).optional(),
})

const getDramaRecapTaskStatusSchema = z.object({
  taskId: z.string(),
})

export enum DramaRecapToolName {
  SubmitDramaRecapTask = 'submitDramaRecapTask',
  GetDramaRecapTaskStatus = 'getDramaRecapTaskStatus',
}

@Injectable()
export class DramaRecapMcp {
  private readonly logger = new Logger(DramaRecapMcp.name)

  constructor(
    private readonly dramaRecapService: DramaRecapService,
  ) { }

  createSubmitDramaRecapTaskTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      DramaRecapToolName.SubmitDramaRecapTask,
      `Submit a drama recap (narration) task to generate narrated videos from short drama clips.

**IMPORTANT: DO NOT call getVideoInfo before this task.**

**Parameters**:
- vids: Array of video VIDs (vid://xxx format). URLs auto-uploaded.
- dramaScriptTaskId: Optional (auto-generated if not provided)
- recapText: Custom narration text (optional, auto-generated if not provided)
- speakerConfig: Voice synthesis config (appId, cluster, voiceType)
- isEraseSubtitle: Erase subtitles (default: true)
- fontConfig: Subtitle font config (color, size, name)
- recapStyle: AI narration style (e.g., "humorous", "suspenseful", "light")
- recapTextSpeed: Speech speed (0.5-2.0, default: 1.2)
- recapTextLength: Expected text length in chars (max: 5000)
- pauseTime: Pause between sentences in ms (1-1000, default: 120)
- batchGenerateCount: Number of videos to generate (default: 1)

Processing time: ~10 minutes per 1-minute video. Returns taskId and dramaScriptTaskId.`,
      submitDramaRecapTaskSchema.shape,
      async ({ ...params }) => {
        const result = await this.dramaRecapService.submitDramaRecapTask({
          userId,
          userType,
          ...params,
        })
        return successResult(`Drama recap task submitted successfully. TaskId: ${result.taskId}, DramaScriptTaskId: ${result.dramaScriptTaskId}`)
      },
    )
  }

  createGetDramaRecapTaskStatusTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      DramaRecapToolName.GetDramaRecapTaskStatus,
      `Get drama recap task status and results.

**Returns**: Status (Processing/Completed/Failed), outputVid and outputUrl on completion.

**Error Codes**: 400100 (Invalid params), 500100 (Internal error), 500110 (Slicing failed), 500111 (Audio extraction failed), 500120 (Script restoration failed), 500130 (Narration generation failed), 400200 (Duration too long, max 60min), 400201 (Too many words).`,
      getDramaRecapTaskStatusSchema.shape,
      async ({ taskId }) => {
        const result = await this.dramaRecapService.getDramaRecapTask({
          userId,
          userType,
          taskId,
        })

        if (result.status === DramaRecapTaskStatus.Completed) {
          if (result.outputVid) {
            return successResult(`Task completed successfully! Output video VID: ${result.outputVid}${result.outputUrl ? `, URL: ${result.outputUrl}` : ''}`)
          }
          else {
            return successResult('Task completed successfully!')
          }
        }
        else if (result.status === DramaRecapTaskStatus.Processing) {
          return successResult('Task is still running. Please continue to wait...')
        }
        else {
          return errorResult(`Task failed: ${result.errorMessage || 'Unknown error'}`)
        }
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.DramaRecap,
      version: '1.0.0',
      tools: [
        this.createSubmitDramaRecapTaskTool(userId, userType),
        this.createGetDramaRecapTaskStatusTool(userId, userType),
      ],
    })
  }
}
