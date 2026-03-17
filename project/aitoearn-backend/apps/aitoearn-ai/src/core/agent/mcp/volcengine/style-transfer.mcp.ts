import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { z } from 'zod'
import { VideoStyleTransferService } from '../../../ai/aideo'
import { AideoTaskStatus } from '../../../ai/libs/volcengine'
import { McpServerName } from '../../agent.constants'
import { errorResult, successResult, wrapTool } from '../mcp.utils'

const submitVideoStyleTransferSchema = z.object({
  videoInput: z.string(),
  style: z.string().optional(),
  resolution: z.enum(['480p', '720p', '1080p']),
})

const getVideoStyleTransferStatusSchema = z.object({
  taskId: z.string(),
})

export enum StyleTransferToolName {
  SubmitVideoStyleTransfer = 'submitVideoStyleTransfer',
  GetVideoStyleTransferStatus = 'getVideoStyleTransferStatus',
}

@Injectable()
export class StyleTransferMcp {
  private readonly logger = new Logger(StyleTransferMcp.name)

  constructor(
    private readonly videoStyleTransferService: VideoStyleTransferService,
  ) { }

  createSubmitVideoStyleTransferTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      StyleTransferToolName.SubmitVideoStyleTransfer,
      `Submit a video style transfer task to convert live-action videos into artistic styles.

**Parameters**:
- videoInput: Video URL or VID (vid://xxx format); URLs auto-uploaded
- style: Target style - "漫画风" (Comic, default), "3D卡通风格" (3D Cartoon), "日漫风格" (Japanese Anime)
- resolution: Output resolution - 480p (0.7x price), 720p (1.0x price), 1080p (1.8x price)

Processing time: ~10 minutes per 1-minute video. Returns taskId for status tracking.`,
      submitVideoStyleTransferSchema.shape,
      async ({ videoInput, style, resolution }) => {
        const result = await this.videoStyleTransferService.submitVideoStyleTransferTask({
          userId,
          userType,
          videoInput,
          style,
          resolution,
        })
        return successResult(`Video style transfer task submitted successfully. TaskId: ${result.taskId}`)
      },
    )
  }

  createGetVideoStyleTransferStatusTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      StyleTransferToolName.GetVideoStyleTransferStatus,
      'Get video style transfer task status. Returns status (Processing/Completed/Failed), and when completed, returns outputVid and outputUrl.',
      getVideoStyleTransferStatusSchema.shape,
      async ({ taskId }) => {
        const result = await this.videoStyleTransferService.getVideoStyleTransferTask({
          userId,
          userType,
          taskId,
        })

        if (result.status === AideoTaskStatus.Completed) {
          return successResult(`Task completed successfully! Output video URL: ${result.outputUrl}, VID: ${result.outputVid}`)
        }
        else if (result.status === AideoTaskStatus.Processing) {
          return successResult(`Task is still processing. Please continue to wait...`)
        }
        else {
          return errorResult(`Task failed: ${result.errorMessage}`)
        }
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.StyleTransfer,
      version: '1.0.0',
      tools: [
        this.createSubmitVideoStyleTransferTool(userId, userType),
        this.createGetVideoStyleTransferStatusTool(userId, userType),
      ],
    })
  }
}
