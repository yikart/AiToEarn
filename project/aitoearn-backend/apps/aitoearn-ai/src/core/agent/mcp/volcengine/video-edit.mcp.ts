import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { CreditsType, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { z } from 'zod'
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

// 火山引擎官方价格表（美分/分钟，已进位保留两位小数）
const VIDEO_EDIT_PRICING_TABLE = [
  { maxHeight: 360, centsPerMinute: 0.15 }, // 360P: 0.01 元 → 0.143 → 0.15
  { maxHeight: 480, centsPerMinute: 0.22 }, // 480P: 0.015 元 → 0.214 → 0.22
  { maxHeight: 540, centsPerMinute: 0.29 }, // 540P: 0.02 元 → 0.286 → 0.29
  { maxHeight: 720, centsPerMinute: 0.43 }, // 720P: 0.03 元 → 0.429 → 0.43
  { maxHeight: 1080, centsPerMinute: 0.86 }, // 1080P: 0.06 元 → 0.857 → 0.86
  { maxHeight: 1440, centsPerMinute: 1.72 }, // 2K: 0.12 元 → 1.714 → 1.72
  { maxHeight: 2160, centsPerMinute: 3.43 }, // 4K: 0.24 元 → 3.429 → 3.43
]

@Injectable()
export class VideoEditMcp {
  private readonly logger = new Logger(VideoEditMcp.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly assetsService: AssetsService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly aiLogRepo: AiLogRepository,
  ) {}

  /**
   * 计算视频编辑价格（美分）
   */
  private calculateVideoEditPrice(durationSeconds: number, resolution: string): number {
    const height = Math.min(...resolution.split('x').map(Number))
    const pricing = VIDEO_EDIT_PRICING_TABLE.find(p => height <= p.maxHeight)
      || VIDEO_EDIT_PRICING_TABLE[VIDEO_EDIT_PRICING_TABLE.length - 1]

    const durationMinutes = durationSeconds / 60
    return durationMinutes * pricing.centsPerMinute
  }

  /**
   * 计算 Track 的总时长（秒）
   */
  private calculateTotalDuration(Track: z.infer<typeof submitDirectEditTaskSchema>['Track']): number {
    let maxEndTime = 0
    for (const layer of Track) {
      for (const element of layer) {
        const endTime = element.TargetTime[1]
        if (endTime > maxEndTime) {
          maxEndTime = endTime
        }
      }
    }
    return maxEndTime / 1000
  }

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

        const totalDuration = this.calculateTotalDuration(Track)
        const resolution = `${canvas.Width}x${canvas.Height}`
        const price = this.calculateVideoEditPrice(totalDuration, resolution)

        await this.creditsHelper.deductCredits({
          userId,
          amount: price,
          type: CreditsType.AiService,
          description: `Video Edit - ${result.ReqId}`,
          metadata: {
            taskId: result.ReqId,
            duration: totalDuration,
            resolution,
          },
        })

        const aiLog = await this.aiLogRepo.create({
          userId,
          userType,
          taskId: result.ReqId,
          model: 'video-edit',
          channel: AiLogChannel.Volcengine,
          startedAt,
          type: AiLogType.VideoEdit,
          points: price,
          request: { Canvas: canvas, Output, tracksCount: Track.length },
          status: AiLogStatus.Generating,
        })

        return successResult(`Video edit task submitted. Task ID: ${aiLog.id}`)
      },
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

          await this.aiLogRepo.updateById(aiLog.id, {
            status: AiLogStatus.Success,
            finishedAt: new Date(),
            response: { outputUrl, outputVid },
          })

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

          await this.aiLogRepo.updateById(aiLog.id, {
            status: AiLogStatus.Failed,
            finishedAt: new Date(),
            response: { error: errorMessage },
          })

          if (aiLog.points && aiLog.points > 0) {
            await this.creditsHelper.addCredits({
              userId: aiLog.userId,
              amount: aiLog.points,
              type: CreditsType.AiService,
              description: `Video Edit Refund - ${volcTaskId}`,
              metadata: {
                taskId: volcTaskId,
                reason: 'task_failed',
              },
            })
          }

          return errorResult(errorMessage)
        }
      },
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
