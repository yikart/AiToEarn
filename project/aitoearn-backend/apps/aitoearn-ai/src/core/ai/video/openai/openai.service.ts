import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { OpenaiService as OpenaiLibService } from '../../libs/openai'
import { ModelsConfigService } from '../../models-config'
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
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
  ) {}

  async calculatePrice(params: {
    model: string
    userId?: string
    userType?: UserType
    duration?: number
  }): Promise<number> {
    const { model, duration } = params

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const defaults = modelConfig.defaults || {}
    const finalDuration = duration || defaults.duration

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const durationMatch = !pricing.duration || !finalDuration || pricing.duration === finalDuration
      return durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  /**
   * OpenAI 视频创建
   */
  async createVideo(request: UserOpenAIVideoCreateRequestDto) {
    const { userId, userType, model, prompt, input_reference, seconds, size } = request

    const pricing = await this.calculatePrice({
      userId,
      userType,
      model: model || 'sora-2',
      duration: seconds ? Number(seconds) : undefined,
    })

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

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

    const result = await this.openaiLibService.createVideo({
        prompt,
        input_reference: inputReferenceUploadable,
        model: model as 'sora-2' | 'sora-2-pro',
        // SDK 类型定义有误，实际支持 '10' | '15' | '25'
        seconds: seconds as '4' | '8' | '12' | undefined,
        size,
      })

    if (userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: pricing,
        type: CreditsType.AiService,
        description: model || 'sora-2',
      })
    }

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model: model || 'sora-2',
      channel: AiLogChannel.OpenAI,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
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
      points: pricing,
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

    const pricing = await this.calculatePrice({
      userId,
      userType,
      model,
    })

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.openaiLibService.remixVideo(aiLog.taskId!, prompt)

    if (userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: pricing,
        type: CreditsType.AiService,
        description: model,
      })
    }

    const newAiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model,
      channel: AiLogChannel.OpenAI,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
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

    if (aiLog.status !== AiLogStatus.Generating && status !== 'completed' && status !== 'failed') {
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
        const uploadResult = await this.assetsService.uploadFromBuffer(aiLog.userId, buffer, {
          type: AssetType.AiVideo,
          mimeType: 'video/mp4',
        }, `${aiLog.model}`)
        videoUrl = uploadResult.asset.path
      }
      else {
        // 如果有直接的 URL，保存到 S3
        const uploadResult = await this.assetsService.uploadFromUrl(aiLog.userId, {
          url: videoUrl,
          type: AssetType.AiVideo,
        }, `${aiLog.model}`)
        videoUrl = uploadResult.asset.path
      }

      // 更新 data 中的 URL
      data.url = videoUrl
      data.video_url = videoUrl
    }

    const duration = data.completed_at ? (data.completed_at * 1000) - aiLog.startedAt.getTime() : Date.now() - aiLog.startedAt.getTime()

    await this.aiLogRepo.updateById(aiLog.id, {
      status: aiLogStatus,
      response: data,
      duration,
      errorMessage: status === 'failed' ? data.error?.message : undefined,
    })

    if (aiLogStatus === AiLogStatus.Failed) {
    }

    if (aiLogStatus === AiLogStatus.Success || aiLogStatus === AiLogStatus.Failed) {
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

    return aiLog.response as unknown as OpenAIVideoCallbackDto
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

  extractInput(request: Record<string, unknown>) {
    return {
      prompt: (request['prompt'] as string) || '',
      image: request['input_reference'] as string | undefined,
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
