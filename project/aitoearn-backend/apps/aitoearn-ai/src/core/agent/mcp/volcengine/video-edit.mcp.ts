import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { z } from 'zod'
import { AiAvailabilityService } from '../../../ai-availability'
import { VolcengineService } from '../../../ai/libs/volcengine'
import { DirectEditApplicationType, DirectEditParam } from '../../../ai/libs/volcengine/volcengine.interface'
import { McpServerName } from '../../agent.constants'
import { errorResult, successResult, wrapTool } from '../mcp.utils'
import {
  getVideoEditTaskStatusSchema,
  submitDirectEditTaskSchema,
  VideoEditToolName,
} from './common'
import { VolcengineVideoUtils } from './volcengine.utils'

@Injectable()
export class VideoEditMcp {
  private readonly logger = new Logger(VideoEditMcp.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly assetsService: AssetsService,
    private readonly aiAvailability: AiAvailabilityService,
    private readonly aiLogRepo: AiLogRepository,
  ) {}

  /**
   * 从 Track 中推导 Canvas 尺寸
   * 若 Canvas 已提供则直接返回，否则从 Track 中提取第一个 vid:// 视频源的实际尺寸
   */
  private async resolveCanvas(
    canvas: { Width: number, Height: number } | undefined,
    track: z.infer<typeof submitDirectEditTaskSchema>['Track'],
  ): Promise<{ Width: number, Height: number }> {
    if (canvas) {
      return canvas
    }

    let vid: string | undefined
    for (const layer of track) {
      for (const element of layer) {
        if (element.Type === 'video' && element.Source?.startsWith('vid://')) {
          vid = element.Source.replace('vid://', '')
          break
        }
      }
      if (vid)
        break
    }

    if (!vid) {
      throw new Error('Canvas not provided and no vid:// video source found in Track. Please provide Canvas dimensions or use vid:// video sources.')
    }

    const mediaInfos = await this.volcengineService.getMediaInfos({ Vids: vid })
    const sourceInfo = mediaInfos.MediaInfoList?.[0]?.SourceInfo

    if (!sourceInfo?.Width || !sourceInfo?.Height) {
      throw new Error(`Canvas not provided and failed to retrieve video dimensions for vid://${vid}. Please provide Canvas dimensions explicitly.`)
    }

    return { Width: sourceInfo.Width, Height: sourceInfo.Height }
  }

  /**
   * 提交视频编辑任务（直接使用 Track 结构）
   */
  createSubmitDirectEditTaskTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      VideoEditToolName.SubmitDirectEditTask,
      `Submit a video editing task using Volcengine Track structure.

**CRITICAL - ALL PosX/PosY Rules**:
- ALL PosX/PosY values are TOP-LEFT corner coordinates, NOT center point
- This applies to: transform, crop, delogo, and any other filter with PosX/PosY
- For full-screen video: ALWAYS use PosX: 0, PosY: 0
- WRONG: Using canvas center (640, 360) or (360, 640) - this causes video to go off-canvas
- CORRECT: Use (0, 0) for top-left alignment when video should fill the canvas

**Canvas** (optional, recommended to omit):
- If omitted, auto-detected from the primary video source in Track (recommended)
- Only provide when you need a custom canvas size (cropping, letterboxing, rotation)
- If provided: Width = horizontal pixels, Height = vertical pixels (from getVideoInfo)
- DO NOT swap Width and Height

**IMPORTANT**: Before using this tool, you must read the "editing-videos" skill document to understand the complete EditParam structure and available resource IDs.

**Time unit**: All time values are in MILLISECONDS (1 second = 1000 milliseconds)

**Workflow**:
1. Call getVideoInfo to get source video VID and dimensions
2. Read the "editing-videos" skill for EditParam reference
3. Build your Track structure with correct PosX/PosY values (top-left corner!)
4. Submit with this tool (omit Canvas for auto-detection)
5. Poll getVideoEditTaskStatus for results`,
      submitDirectEditTaskSchema.shape,
      async ({ Canvas: inputCanvas, Output, Track }) => {
        const startedAt = new Date()
        const timestamp = Date.now().toString(16)

        const canvas = await this.resolveCanvas(inputCanvas, Track)

        const editParam: DirectEditParam = {
          Canvas: {
            Width: canvas.Width,
            Height: canvas.Height,
          },
          Output: Output
            ? {
                Fps: Output.Fps,
                DisableVideo: Output.DisableVideo,
                DisableAudio: Output.DisableAudio,
                Alpha: Output.Alpha,
                Codec: Output.Codec
                  ? {
                      VideoCodec: Output.Codec.VideoCodec,
                      AudioCodec: Output.Codec.AudioCodec,
                      VideoBitrate: Output.Codec.VideoBitRate,
                      AudioBitrate: Output.Codec.AudioBitrate,
                    }
                  : undefined,
              }
            : undefined,
          Track: Track as DirectEditParam['Track'],
          Upload: {
            SpaceName: this.volcengineService['config'].spaceName,
            VideoName: `direct_edit_${timestamp}`,
            FileName: `direct_edit_${timestamp}.mp4`,
          },
        }

        const result = await this.volcengineService.submitDirectEditTaskAsync({
          Application: DirectEditApplicationType.VideoTrackToB,
          EditParam: editParam,
        })

        const aiLog = await this.aiLogRepo.create({
          userId,
          userType,
          taskId: result.ReqId,
          model: 'video-edit',
          channel: AiLogChannel.Volcengine,
          startedAt,
          type: AiLogType.VideoEdit,
          request: { Canvas: canvas, Output, tracksCount: Track.length },
          status: AiLogStatus.Generating,
        })

        return successResult(`Video edit task submitted. Task ID: ${aiLog.id}`)
      },
      this.aiAvailability,
    )
  }

  /**
   * 查询视频剪辑任务状态
   */
  createGetVideoEditTaskStatusTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      VideoEditToolName.GetVideoEditTaskStatus,
      `Check the status of a video editing task.

**Status values**:
- pending/start/processing: Task is running
- success: Task completed, returns output URL
- failed/failed_run: Task failed with error message

Returns detailed error information on failure.`,
      getVideoEditTaskStatusSchema.shape,
      async ({ taskId }) => {
        const aiLog = await this.aiLogRepo.getById(taskId)
        if (!aiLog) {
          return errorResult('Task not found. Please check the task ID.')
        }

        const volcTaskId = aiLog.taskId
        if (!volcTaskId) {
          return errorResult('Task record is invalid. Missing Volcengine task ID.')
        }

        if (aiLog.status === AiLogStatus.Success) {
          const outputUrl = aiLog.response?.outputUrl
          return successResult(
            outputUrl
              ? `Task completed successfully! Output Video URL: ${outputUrl}. The video has been processed and is now available.`
              : 'Task completed successfully.',
          )
        }

        if (aiLog.status === AiLogStatus.Failed) {
          return errorResult(aiLog.response?.error ?? 'Task failed.')
        }

        const result = await this.volcengineService.getDirectEditResult({
          ReqIds: [volcTaskId],
        })

        if (result.Status === 'success') {
          const outputVid = result.OutputVid

          if (!outputVid) {
            return errorResult('Task completed but no output video found.')
          }

          this.logger.debug({ taskId, volcTaskId, outputVid }, '[VideoEdit] 任务完成，开始下载上传')

          const outputUrl = await VolcengineVideoUtils.saveVideoFromVid(
            outputVid,
            userId,
            'edited',
            'video-edit',
            this.volcengineService,
            this.assetsService,
            this.logger,
            AssetType.VideoEdit,
          )

          if (!outputUrl) {
            this.logger.error({ taskId, volcTaskId, outputVid }, '[VideoEdit] 视频上传失败')
            return errorResult('Task completed but failed to upload video. Please try again.')
          }

          this.logger.debug({ taskId, outputUrl }, '[VideoEdit] 视频上传成功')

          const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(aiLog.id, AiLogStatus.Generating, {
            $set: {
              status: AiLogStatus.Success,
              finishedAt: new Date(),
              response: { outputUrl, outputVid },
            },
          })

          if (!updatedAiLog) {
            return errorResult('Task is no longer running. Please check the task status again.')
          }

          return successResult(
            `Task completed successfully! Output Video URL: ${outputUrl}. The video has been processed and is now available.`,
          )
        }
        else if (result.Status === 'processing' || result.Status === 'pending' || result.Status === 'start') {
          return successResult('Task is still processing. Please continue to wait and check again...')
        }
        else {
          const errorMessage = result.Message
            ? `Task failed: ${result.Message}`
            : 'Task failed. Please check the video source and parameters, then try again.'

          const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(aiLog.id, AiLogStatus.Generating, {
            $set: {
              status: AiLogStatus.Failed,
              finishedAt: new Date(),
              response: { error: errorMessage },
            },
          })

          if (!updatedAiLog) {
            return errorResult('Task is no longer running. Please check the task status again.')
          }

          return errorResult(errorMessage)
        }
      },
      this.aiAvailability,
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.VideoEdit,
      version: '1.0.0',
      tools: [
        this.createSubmitDirectEditTaskTool(userId, userType),
        this.createGetVideoEditTaskStatusTool(userId, userType),
      ],
    })
  }
}

export { VideoEditToolName } from './common'
