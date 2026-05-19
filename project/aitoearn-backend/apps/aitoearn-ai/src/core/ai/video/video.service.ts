import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import {
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
  MaterialGroupRepository,
  MediaRepository,
  MediaType,
  UserRepository,
} from '@yikart/mongodb'
import { TaskStatus } from '../../../common'
import { ModelsConfigService } from '../models-config'
import { DashscopeVideoService } from './dashscope'
import { GeminiVideoService } from './gemini'
import { GrokVideoService } from './grok'
import { OpenAIVideoService } from './openai'
import { VideoAiLog } from './video-ai-log.interface'
import {
  UserListVideoTasksQueryDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VideoGenerationModelsQueryDto,
} from './video.dto'
import { VideoTaskInput } from './video.vo'
import { VolcengineVideoService } from './volcengine'

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)

  constructor(
    private readonly userRepo: UserRepository,
    private readonly aiLogRepo: AiLogRepository,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly assetsService: AssetsService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly materialGroupRepository: MaterialGroupRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly volcengineVideoService: VolcengineVideoService,
    private readonly openaiVideoService: OpenAIVideoService,
    private readonly grokVideoService: GrokVideoService,
    private readonly geminiVideoService: GeminiVideoService,
    private readonly dashscopeVideoService: DashscopeVideoService,
  ) {}

  async calculateVideoGenerationPrice(params: {
    model: string
    userId?: string
    userType?: UserType
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }): Promise<number> {
    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === params.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    switch (modelConfig.channel) {
      case AiLogChannel.Volcengine:
        return this.volcengineVideoService.calculatePrice(params)
      case AiLogChannel.OpenAI:
        return this.openaiVideoService.calculatePrice(params)
      case AiLogChannel.Grok:
        return this.grokVideoService.calculatePrice(params)
      case AiLogChannel.Gemini:
        return this.geminiVideoService.calculatePrice(params)
      case AiLogChannel.Dashscope:
        return this.dashscopeVideoService.calculatePrice(params)
      default:
        throw new AppException(ResponseCode.InvalidModel)
    }
  }

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const { model, groupId, userId } = request

    if (groupId) {
      const group = await this.materialGroupRepository.getInfo(groupId)
      if (!group || group.userId !== userId) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
    }

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    let response: { id: string, points: number }

    switch (modelConfig.channel) {
      case AiLogChannel.Volcengine:
        response = await this.volcengineVideoService.createFromRequest(request)
        break
      case AiLogChannel.OpenAI:
        response = await this.openaiVideoService.createFromRequest(request)
        break
      case AiLogChannel.Grok:
        response = await this.grokVideoService.createFromRequest(request)
        break
      case AiLogChannel.Dashscope:
        response = await this.dashscopeVideoService.createFromRequest(request)
        break
      default:
        throw new AppException(ResponseCode.InvalidModel)
    }

    if (groupId) {
      await this.aiLogRepo.updateById(response.id, {
        $set: {
          'request.groupId': groupId,
        },
      })
    }

    return {
      id: response.id,
      status: TaskStatus.Submitted,
      points: response.points,
    }
  }

  private extractInput(aiLog: VideoAiLog): VideoTaskInput {
    let input: VideoTaskInput
    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
        input = this.volcengineVideoService.extractInput(aiLog.request)
        break
      case AiLogChannel.OpenAI:
        input = this.openaiVideoService.extractInput(aiLog.request)
        break
      case AiLogChannel.Grok:
        input = this.grokVideoService.extractInput(aiLog.request)
        break
      case AiLogChannel.Gemini:
        input = this.geminiVideoService.extractInput(aiLog.request)
        break
      case AiLogChannel.Dashscope:
        input = this.dashscopeVideoService.extractInput(aiLog.request)
        break
      default:
        input = { prompt: '' }
        break
    }

    return {
      ...input,
      groupId: aiLog.request.groupId,
    }
  }

  async transformToCommonResponse(aiLog: VideoAiLog) {
    const input = this.extractInput(aiLog)
    const savedMedia = await this.ensureSavedVideoMedia(aiLog)

    const base = {
      id: aiLog.id,
      model: aiLog.model,
      input,
      submittedAt: aiLog.startedAt,
      startedAt: aiLog.startedAt,
    }

    if (aiLog.status === AiLogStatus.Generating) {
      return {
        ...base,
        status: TaskStatus.InProgress,
        videoUrl: undefined,
        coverUrl: savedMedia.coverUrl ? FileUtil.buildUrl(savedMedia.coverUrl) : undefined,
        mediaId: savedMedia.mediaId,
        groupId: savedMedia.groupId,
        error: undefined,
        finishedAt: undefined,
      }
    }

    if (!aiLog.response) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    const finishedAt = aiLog.duration
      ? new Date(aiLog.startedAt.getTime() + aiLog.duration)
      : undefined

    const channelResult = this.getChannelTaskResult(aiLog)

    return {
      ...base,
      ...channelResult,
      coverUrl: savedMedia.coverUrl ? FileUtil.buildUrl(savedMedia.coverUrl) : undefined,
      mediaId: savedMedia.mediaId,
      groupId: savedMedia.groupId,
      finishedAt,
    }
  }

  async ensureSavedMediaByAiLogId(aiLogId: string): Promise<void> {
    const aiLog = await this.aiLogRepo.getById(aiLogId)
    if (!aiLog || aiLog.type !== AiLogType.Video) {
      return
    }

    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
      case AiLogChannel.OpenAI:
      case AiLogChannel.Grok:
      case AiLogChannel.Gemini:
      case AiLogChannel.Dashscope:
        await this.ensureSavedVideoMedia(aiLog as VideoAiLog)
    }
  }

  private getChannelTaskResult(aiLog: VideoAiLog) {
    if (!aiLog.response) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
        return this.volcengineVideoService.getTaskResult(aiLog.response)
      case AiLogChannel.OpenAI:
        return this.openaiVideoService.getTaskResult(aiLog.response)
      case AiLogChannel.Grok:
        return this.grokVideoService.getTaskResult(aiLog.response)
      case AiLogChannel.Gemini:
        return this.geminiVideoService.getTaskResult(aiLog.response)
      case AiLogChannel.Dashscope:
        return this.dashscopeVideoService.getTaskResult(aiLog.response)
      default:
        throw new AppException(ResponseCode.InvalidAiTaskId)
    }
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const { taskId } = request

    const aiLog = await this.aiLogRepo.getById(taskId)

    if (aiLog == null || aiLog.type !== AiLogType.Video) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
      case AiLogChannel.OpenAI:
      case AiLogChannel.Grok:
      case AiLogChannel.Gemini:
      case AiLogChannel.Dashscope:
        return this.transformToCommonResponse(aiLog as VideoAiLog)
      default:
        throw new AppException(ResponseCode.InvalidAiTaskId)
    }
  }

  async listVideoTasks(request: UserListVideoTasksQueryDto) {
    const [aiLogs, count] = await this.aiLogRepo.listWithPagination({
      ...request,
      type: AiLogType.Video,
    })

    return [
      await Promise.all(aiLogs.map((log) => {
        switch (log.channel) {
          case AiLogChannel.Volcengine:
          case AiLogChannel.OpenAI:
          case AiLogChannel.Grok:
          case AiLogChannel.Gemini:
          case AiLogChannel.Dashscope:
            return this.transformToCommonResponse(log as VideoAiLog)
          default:
            throw new AppException(ResponseCode.InvalidAiTaskId)
        }
      })),
      count,
    ] as const
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams(_data: VideoGenerationModelsQueryDto) {
    return this.modelsConfigService.config.video.generation
  }

  private async ensureSavedVideoMedia(aiLog: VideoAiLog): Promise<{ mediaId?: string, coverUrl?: string, groupId?: string }> {
    const response = aiLog.response
    const request = aiLog.request
    const existingMediaId = response?.mediaId
    const existingCoverUrl = response?.coverUrl

    if (existingMediaId) {
      return {
        mediaId: existingMediaId,
        coverUrl: existingCoverUrl,
        groupId: response?.groupId ?? request.groupId,
      }
    }

    if (aiLog.status !== AiLogStatus.Success || !response) {
      return {}
    }

    const targetGroupId = response.groupId ?? request.groupId
    if (!targetGroupId) {
      return {}
    }

    try {
      const commonResult = this.getChannelTaskResult(aiLog)
      if (!commonResult.videoUrl) {
        this.logger.warn({ aiLogId: aiLog.id, channel: aiLog.channel }, 'Video task succeeded but video path is missing')
        return {}
      }
      const videoPath = FileUtil.trimHost(commonResult.videoUrl)

      let coverPath = existingCoverUrl
      if (!coverPath) {
        try {
          const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(commonResult.videoUrl, 2)
          const uploadResult = await this.assetsService.uploadFromBuffer(aiLog.userId, thumbnailBuffer, {
            type: AssetType.VideoThumbnail,
            mimeType: 'image/png',
            filename: 'thumbnail.png',
          })
          coverPath = uploadResult.asset.path
        }
        catch (error) {
          this.logger.warn({ error, aiLogId: aiLog.id }, 'Failed to generate thumbnail for saved video media')
        }
      }

      const media = await this.mediaRepository.create({
        userId: aiLog.userId,
        userType: aiLog.userType,
        materialGroupId: targetGroupId,
        type: MediaType.VIDEO,
        url: videoPath,
        thumbUrl: coverPath,
      })

      await this.aiLogRepo.updateById(aiLog.id, {
        $set: {
          response: {
            ...response,
            mediaId: media.id,
            groupId: targetGroupId,
            ...(coverPath ? { coverUrl: coverPath } : {}),
          },
        },
      })

      return {
        mediaId: media.id,
        coverUrl: coverPath,
        groupId: targetGroupId,
      }
    }
    catch (error) {
      this.logger.warn({ error, aiLogId: aiLog.id, groupId: targetGroupId }, 'Failed to save generated video to material')
      return {}
    }
  }
}
