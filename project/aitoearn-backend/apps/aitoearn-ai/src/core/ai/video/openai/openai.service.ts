import type { OpenAIVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AssetsService, StorageProvider } from '@yikart/assets'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import { OpenaiService as OpenaiLibService } from '../../libs/openai'
import {
  OpenAIVideoCallbackDto,
  SoraCharacterCallbackDto,
  UserOpenAIVideoCreateRequestDto,
  UserOpenAIVideoRemixRequestDto,
  UserSoraCharacterCreateRequestDto,
} from './openai.dto'

@Injectable()
export class OpenAIVideoService {
  private readonly logger = new Logger(OpenAIVideoService.name)

  constructor(
    private readonly openaiLibService: OpenaiLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly storageProvider: StorageProvider,
    private readonly aiAvailability: AiAvailabilityService,
  ) {}

  private async toAccessibleUrl(url: string | undefined): Promise<string | undefined> {
    if (!url) {
      return undefined
    }
    const parsed = this.storageProvider.parsePathFromUrl(url)
    if (parsed.startsWith('http')) {
      return url
    }
    return this.storageProvider.toPresignedUrl(url)
  }

  async createFromRequest(request: UserVideoGenerationRequestDto): Promise<{ id: string }> {
    if (Array.isArray(request.image)) {
      throw new BadRequestException('OpenAI does not support multiple images')
    }

    const result = await this.createVideo({
      userId: request.userId,
      userType: request.userType,
      prompt: request.prompt,
      input_reference: await this.toAccessibleUrl(request.image),
      model: request.model as 'sora-2' | 'sora-2-pro',
      seconds: request.duration ? request.duration.toString() as '10' | '15' | '25' : undefined,
      size: request.size as '720x1280' | '1280x720' | '1024x1792' | '1792x1024' | undefined,
    })

    return { id: result.id }
  }

  /**
   * OpenAI 视频创建
   */
  async createVideo(request: UserOpenAIVideoCreateRequestDto) {
    const { userId, userType, model, prompt, input_reference, seconds, size } = request

    const startedAt = new Date()

    // 如果 input_reference 是 URL，需要先 fetch 后传入 Response
    let inputReferenceUploadable: Response | undefined
    if (input_reference) {
      const response = await fetch(input_reference)
      if (!response.ok) {
        throw new AppException(ResponseCode.S3DownloadFileFailed)
      }
      inputReferenceUploadable = response
    }

    const result = await this.aiAvailability.executeAsync(
      { provider: 'openai', operation: 'videoGeneration', model: model || 'sora-2' },
      () => this.openaiLibService.createVideo({
        prompt,
        input_reference: inputReferenceUploadable,
        model: model as 'sora-2' | 'sora-2-pro',
        // SDK 类型定义有误，实际支持 '10' | '15' | '25'
        seconds: seconds as '4' | '8' | '12' | undefined,
        size,
      }),
      r => r.id,
    )

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model: model || 'sora-2',
      channel: AiLogChannel.OpenAI,
      startedAt,
      type: AiLogType.Video,
      request: {
        prompt,
        input_reference,
        model,
        seconds,
        size,
      },
      status: AiLogStatus.Generating,
    })

    return {
      ...result,
      id: aiLog.id,
    }
  }

  /**
   * OpenAI 视频 Remix
   */
  async remixVideo(request: UserOpenAIVideoRemixRequestDto) {
    const { userId, userType, videoId, prompt } = request

    // 首先查找原视频任务
    const aiLog = await this.aiLogRepo.getByIdAndUserId(videoId, userId, userType)
    if (!aiLog || aiLog.channel !== AiLogChannel.OpenAI || !aiLog.taskId) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    const model = aiLog.model

    const startedAt = new Date()
    const result = await this.aiAvailability.executeAsync(
      { provider: 'openai', operation: 'videoGeneration', model },
      () => this.openaiLibService.remixVideo(aiLog.taskId!, prompt),
      r => r.id,
    )

    const newAiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model,
      channel: AiLogChannel.OpenAI,
      startedAt,
      type: AiLogType.Video,
      request: {
        prompt,
        remixed_from_video_id: aiLog.taskId,
      },
      status: AiLogStatus.Generating,
    })

    return {
      ...result,
      id: newAiLog.id,
    }
  }

  /**
   * OpenAI回调处理
   */
  async callback(data: OpenAIVideoCallbackDto) {
    const { id, status } = data

    const aiLog = await this.aiLogRepo.getByTaskId(id)
    if (!aiLog || aiLog.channel !== AiLogChannel.OpenAI) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const openAiLog = aiLog as OpenAIVideoAiLog

    if (openAiLog.status !== AiLogStatus.Generating && status !== 'completed' && status !== 'failed') {
      return
    }

    this.logger.debug({
      taskId: data.id,
      status: data.status,
    }, `OpenAI callback`)

    let aiLogStatus: AiLogStatus
    switch (status) {
      case 'completed':
        aiLogStatus = AiLogStatus.Success
        break
      case 'failed':
        aiLogStatus = AiLogStatus.Failed
        break
      default:
        aiLogStatus = AiLogStatus.Generating
        break
    }

    // 处理视频下载
    if (aiLogStatus === AiLogStatus.Success) {
      // 优先使用第三方提供的 url 或 video_url
      let videoUrl = data.url || data.video_url

      // 如果没有直接的 URL，则使用 downloadContent
      if (!videoUrl) {
        const response = await this.openaiLibService.downloadVideoContent(id, 'video')
        if (!response.body) {
          throw new AppException(ResponseCode.S3DownloadFileFailed)
        }
        const buffer = Buffer.from(await response.arrayBuffer())
        const uploadResult = await this.assetsService.uploadFromBuffer(openAiLog.userId, buffer, {
          type: AssetType.AiVideo,
          mimeType: 'video/mp4',
        }, `${openAiLog.model}`)
        videoUrl = uploadResult.asset.path
      }
      else {
        // 如果有直接的 URL，保存到 S3
        const uploadResult = await this.assetsService.uploadFromUrl(openAiLog.userId, {
          url: videoUrl,
          type: AssetType.AiVideo,
        }, `${openAiLog.model}`)
        videoUrl = uploadResult.asset.path
      }

      // 更新 data 中的 URL
      data.url = videoUrl
      data.video_url = videoUrl
    }

    const duration = data.completed_at ? (data.completed_at * 1000) - openAiLog.startedAt.getTime() : Date.now() - openAiLog.startedAt.getTime()

    const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(openAiLog.id, AiLogStatus.Generating, {
      $set: {
        status: aiLogStatus,
        response: data,
        duration,
        errorMessage: status === 'failed' ? data.error?.message : undefined,
      },
    })

    if (!updatedAiLog) {
      return
    }

    if (aiLogStatus === AiLogStatus.Success || aiLogStatus === AiLogStatus.Failed) {
      await this.aiAvailability.recordAsyncComplete(
        id,
        { provider: 'openai', operation: 'videoGeneration', model: openAiLog.model },
        {
          success: aiLogStatus === AiLogStatus.Success,
          latencyMs: duration,
          errorMessage: status === 'failed' ? data.error?.message : undefined,
        },
      )
    }
  }

  /**
   * 查询OpenAI任务状态
   */
  async getVideo(userId: string, userType: UserType, videoId: string): Promise<OpenAIVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(videoId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.OpenAI) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const openAiLog = aiLog as OpenAIVideoAiLog

    return openAiLog.response!
  }

  /**
   * 查询OpenAI任务结果
   */
  getTaskResult(result: OpenAIVideoCallbackDto) {
    const status = {
      queued: TaskStatus.Submitted,
      in_progress: TaskStatus.InProgress,
      completed: TaskStatus.Success,
      failed: TaskStatus.Failure,
    }[result.status]

    const rawUrl = result.url || result.video_url
    return {
      status,
      videoUrl: rawUrl ? FileUtil.buildUrl(rawUrl) : undefined,
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  extractInput(request: OpenAIVideoAiLog['request']) {
    return {
      prompt: request.prompt || '',
      image: request.input_reference,
    }
  }

  /**
   * 创建 Sora 角色
   */
  async createCharacter(request: UserSoraCharacterCreateRequestDto): Promise<SoraCharacterCallbackDto> {
    const { userId, userType, prompt, videoUrl, taskId, timestamps } = request

    let url: string | undefined
    let soraTaskId: string | undefined

    if (taskId) {
      const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)
      if (!aiLog || aiLog.channel !== AiLogChannel.OpenAI || !aiLog.taskId) {
        throw new AppException(ResponseCode.InvalidAiTaskId)
      }
      soraTaskId = aiLog.taskId
    }
    else if (videoUrl) {
      url = videoUrl
    }
    else {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    const result = await this.openaiLibService.createCharacter({
      model: 'sora-2-character',
      url,
      taskId: soraTaskId,
      timestamps,
      prompt,
    })
    this.logger.debug({ result }, 'Create Sora character')

    return {
      id: result.id,
      object: 'character',
      model: 'sora-2-character',
      status: result.status,
      username: result.username,
      created_at: result.created_at,
      completed_at: result.completed_at,
      error: result.error,
    }
  }

  /**
   * 查询 Sora 角色状态
   */
  async getCharacter(userId: string, userType: UserType, characterId: string): Promise<SoraCharacterCallbackDto> {
    const result = await this.openaiLibService.getCharacter(characterId)

    return {
      id: result.id,
      object: 'character',
      model: 'sora-2-character',
      status: result.status,
      username: result.username,
      avatar_url: result.avatar_url,
      created_at: result.created_at,
      completed_at: result.completed_at,
      error: result.error,
    }
  }
}
