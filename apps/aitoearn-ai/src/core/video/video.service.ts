import path from 'node:path'
import { BadRequestException, Injectable } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { S3Service } from '@yikart/aws-s3'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { KlingAction, TaskStatus } from '../../common/enums'
import { config } from '../../config'
import {
  Image2VideoCreateTaskResponseData,
  KlingService,
  TaskStatus as KlingTaskStatus,
  Mode,
  MultiImage2VideoCreateTaskResponseData,
  Text2VideoCreateTaskResponseData,
  Text2VideoGetTaskResponseData,
} from '../../libs/kling'
import {
  ContentType,
  CreateVideoGenerationTaskResponse,
  GetVideoGenerationTaskResponse,
  parseModelTextCommand,
  serializeModelTextCommand,
  VolcengineService,
  TaskStatus as VolcTaskStatus,
} from '../../libs/volcengine'
import {
  KlingCallbackDto,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingText2VideoRequestDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VolcengineCallbackDto,
  VolcengineGenerationRequestDto,
} from './video.dto'

@Injectable()
export class VideoService {
  constructor(
    private readonly klingService: KlingService,
    private readonly volcengineService: VolcengineService,
    private readonly userClient: AitoearnUserClient,
    private readonly aiLogRepo: AiLogRepository,
    private readonly s3Service: S3Service,
  ) {}

  async calculateVideoGenerationPrice(params: {
    model: string
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }): Promise<number> {
    const { model } = params

    // 查找对应的模型配置
    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const { resolution, aspectRatio, mode, duration } = {
      ...modelConfig.defaults,
      ...params,
    }

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const resolutionMatch = !pricing.resolution || !resolution || pricing.resolution === resolution
      const aspectRatioMatch = !pricing.aspectRatio || !aspectRatio || pricing.aspectRatio === aspectRatio
      const modeMatch = !pricing.mode || !mode || pricing.mode === mode
      const durationMatch = !pricing.duration || !duration || pricing.duration === duration

      return resolutionMatch && aspectRatioMatch && modeMatch && durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const { userId, userType, model, prompt, mode, duration, size } = request

    // 查找模型配置以确定channel
    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const channel = modelConfig.channel

    if (channel === 'kling') {
      const klingRequest: KlingText2VideoRequestDto = {
        userId,
        userType,
        model_name: model,
        prompt,
        mode: mode === 'std' ? Mode.Std : mode === 'pro' ? Mode.Pro : undefined,
        duration: duration ? duration.toString() as '5' | '10' : undefined,
      }
      const result = await this.klingText2Video(klingRequest)

      return {
        task_id: result.task_id,
        status: TaskStatus.Submitted,
        message: '',
      }
    }
    else if (channel === 'volcengine') {
      const textCommand = parseModelTextCommand(prompt)

      const volcengineRequest: VolcengineGenerationRequestDto = {
        userId,
        userType,
        model,
        content: [
          {
            type: ContentType.Text,
            text: `${textCommand.prompt} ${serializeModelTextCommand({
              ...textCommand.params,
              duration,
              resolution: size,
            })}`,
          },
        ],
      }
      const result = await this.volcengineCreate(volcengineRequest)

      return {
        task_id: result.id,
        status: TaskStatus.Submitted,
        message: '',
      }
    }
    else {
      throw new AppException(ResponseCode.InvalidModel)
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

    if (aiLog.status === AiLogStatus.Generating) {
      return {
        task_id: aiLog.id,
        action: aiLog.channel === 'kling' ? 'text2video' : 'generation',
        status: TaskStatus.InProgress,
        fail_reason: '',
        submit_time: Math.floor(aiLog.startedAt.getTime() / 1000),
        start_time: Math.floor(aiLog.startedAt.getTime() / 1000),
        finish_time: 0,
        progress: '30%',
        data: {},
      }
    }

    if (!aiLog.response) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (aiLog.channel === AiLogChannel.Kling) {
      return await this.getKlingTaskResult(aiLog.response as unknown as Text2VideoGetTaskResponseData)
    }
    else if (aiLog.channel === AiLogChannel.Volcengine) {
      return await this.getVolcengineTaskResult(aiLog.response as unknown as GetVideoGenerationTaskResponse)
    }
    else {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams() {
    return config.ai.models.video.generation
  }

  /**
   * Kling文生视频
   */
  async klingText2Video(request: KlingText2VideoRequestDto) {
    const { userId, userType, model_name, duration, mode, ...params } = request
    const pricing = await this.calculateVideoGenerationPrice({
      model: model_name,
      mode,
      duration: duration ? Number(duration) : undefined,
    })

    if (userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
      await this.userClient.deductPoints({
        userId,
        amount: pricing,
        type: 'ai_service',
        description: model_name,
      })
    }

    const startedAt = new Date()
    const result = await this.klingService.createText2VideoTask({
      ...params,
      mode,
      duration,
      callback_url: config.ai.kling.callbackUrl,
    })

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.data.task_id,
      model: model_name,
      channel: AiLogChannel.Kling,
      action: KlingAction.Text2Video,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: { ...params, mode, duration },
      status: AiLogStatus.Generating,
    })

    return {
      ...result.data,
      task_id: aiLog.id,
    } as Text2VideoCreateTaskResponseData
  }

  /**
   * Kling回调处理
   */
  async klingCallback(callbackData: KlingCallbackDto) {
    const { task_id, task_status, task_status_msg, task_result, updated_at } = callbackData

    const aiLog = await this.aiLogRepo.getByTaskId(task_id)
    if (!aiLog || aiLog.channel !== AiLogChannel.Kling) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (task_status !== KlingTaskStatus.Succeed && task_status !== KlingTaskStatus.Failed) {
      return
    }

    let status: AiLogStatus
    switch (task_status) {
      case KlingTaskStatus.Succeed:
        status = AiLogStatus.Success
        break
      case KlingTaskStatus.Failed:
        status = AiLogStatus.Failed
        break
      default:
        status = AiLogStatus.Generating
        break
    }

    const duration = updated_at - aiLog.startedAt.getTime()
    for (const video of task_result?.videos || []) {
      const filename = `${aiLog.id}-${video.id}.mp4`
      const fullPath = path.join(`ai/video/${aiLog.model}`, aiLog.userId, filename)
      const result = await this.s3Service.putObjectFromUrl(video.url, fullPath)
      video.url = result.path
    }
    for (const image of task_result?.images || []) {
      const filename = `${aiLog.id}-${image.index}.png`
      const fullPath = path.join(`ai/image/${aiLog.model}`, aiLog.userId, filename)
      const result = await this.s3Service.putObjectFromUrl(image.url, fullPath)
      image.url = result.path
    }

    await this.aiLogRepo.updateById(aiLog.id, {
      status,
      response: callbackData,
      duration,
      errorMessage: task_status === 'failed' ? task_status_msg : undefined,
    })

    if (status === AiLogStatus.Failed && aiLog.userType === UserType.User) {
      await this.userClient.addPoints({
        userId: aiLog.userId,
        amount: aiLog.points,
        type: 'ai_service',
        description: aiLog.model,
      })
    }
  }

  /**
   * 查询Kling任务状态
   */
  async getKlingTaskResult(data: Text2VideoGetTaskResponseData) {
    return {
      task_id: data.task_id,
      action: 'text2video',
      status: data.task_status,
      fail_reason: data.task_status_msg || '',
      submit_time: data.created_at,
      start_time: data.created_at,
      finish_time: data.updated_at,
      progress: data.task_status === 'succeed' ? '100%' : '0%',
      data: data.task_result || {},
    }
  }

  async getKlingTask(userId: string, userType: UserType, taskId: string) {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Kling) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    if (aiLog.status === AiLogStatus.Generating) {
      let result: KlingCallbackDto
      switch (aiLog.action) {
        case KlingAction.Image2video:
          result = (await this.klingService.getImage2VideoTask(aiLog.taskId)).data
          break
        case KlingAction.MultiImage2video:
          result = (await this.klingService.getMultiImage2VideoTask(aiLog.taskId)).data
          break
        case KlingAction.MultiElements:
          result = (await this.klingService.getMultiElementsTask(aiLog.taskId)).data
          break
        case KlingAction.VideoExtend:
          result = (await this.klingService.getVideoExtendTask(aiLog.taskId)).data
          break
        case KlingAction.LipSync:
          result = (await this.klingService.getLipSyncTask(aiLog.taskId)).data
          break
        case KlingAction.Effects:
          result = (await this.klingService.getVideoEffectsTask(aiLog.taskId)).data
          break
        case KlingAction.Text2Video:
        default:
          result = (await this.klingService.getText2VideoTask(aiLog.taskId)).data
      }

      if (result.task_status === KlingTaskStatus.Succeed || result.task_status === KlingTaskStatus.Failed) {
        await this.klingCallback(result)
      }
      return result
    }
    return aiLog.response as unknown as KlingCallbackDto
  }

  /**
   * Volcengine回调处理
   */
  async volcengineCallback(callbackData: VolcengineCallbackDto) {
    const { id, status, updated_at, content } = callbackData

    const aiLog = await this.aiLogRepo.getByTaskId(id)
    if (!aiLog || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (status !== VolcTaskStatus.Succeeded && status !== VolcTaskStatus.Failed) {
      return
    }

    let aiLogStatus: AiLogStatus
    switch (status) {
      case VolcTaskStatus.Succeeded:
        aiLogStatus = AiLogStatus.Success
        break
      case VolcTaskStatus.Failed:
        aiLogStatus = AiLogStatus.Failed
        break
      default:
        aiLogStatus = AiLogStatus.Generating
        break
    }

    if (content) {
      if (content.last_frame_url) {
        const filename = `${aiLog.id}-last_frame_url.png`
        const fullPath = path.join(`ai/video/${aiLog.model}`, aiLog.userId, filename)
        const result = await this.s3Service.putObjectFromUrl(content.last_frame_url, fullPath)
        content.last_frame_url = result.path
      }

      const filename = `${aiLog.id}.mp4`
      const fullPath = path.join(`ai/video/${aiLog.model}`, aiLog.userId, filename)
      const result = await this.s3Service.putObjectFromUrl(content.video_url, fullPath)
      content.video_url = result.path
    }

    const duration = (updated_at * 1000) - aiLog.startedAt.getTime()

    await this.aiLogRepo.updateById(aiLog.id, {
      status: aiLogStatus,
      response: callbackData,
      duration,
      errorMessage: status === 'failed' ? callbackData.error?.message : undefined,
    })

    if (aiLogStatus === AiLogStatus.Failed && aiLog.userType === UserType.User) {
      await this.userClient.addPoints({
        userId: aiLog.userId,
        amount: aiLog.points,
        type: 'ai_service',
        description: aiLog.model,
      })
    }
  }

  /**
   * Volcengine视频生成
   */
  async volcengineCreate(request: VolcengineGenerationRequestDto) {
    const { userId, userType, model, content, ...params } = request

    const prompt = content.find(c => c.type === ContentType.Text)?.text

    if (!prompt) {
      throw new BadRequestException('prompt is required')
    }

    const { params: modelParams } = parseModelTextCommand(prompt)

    const pricing = await this.calculateVideoGenerationPrice({
      aspectRatio: modelParams.ratio,
      resolution: modelParams.resolution,
      duration: modelParams.duration,
      model,
    })

    if (userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }

      await this.userClient.deductPoints({
        userId,
        amount: pricing,
        type: 'ai_service',
        description: model,
      })
    }

    const startedAt = new Date()
    const result = await this.volcengineService.createVideoGenerationTask({
      ...params,
      model,
      content,
      callback_url: config.ai.volcengine.callbackUrl,
    })

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model,
      channel: AiLogChannel.Volcengine,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: {
        ...params,
        model,
        content,
      },
      status: AiLogStatus.Generating,
    })

    return {
      ...result,
      id: aiLog.id,
    } as CreateVideoGenerationTaskResponse
  }

  /**
   * 查询Volcengine任务状态
   */
  async getVolcengineTaskResult(result: GetVideoGenerationTaskResponse) {
    return {
      task_id: result.id,
      action: 'generation',
      status: result.status,
      fail_reason: result.error?.message || '',
      submit_time: result.created_at,
      start_time: result.created_at,
      finish_time: result.updated_at,
      progress: result.status === 'succeeded' ? '100%' : '0%',
      data: result.content || {},
    }
  }

  async getVolcengineTask(userId: string, userType: UserType, taskId: string) {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    if (aiLog.status === AiLogStatus.Generating) {
      const result = await this.volcengineService.getVideoGenerationTask(aiLog.taskId)
      if (result.status === VolcTaskStatus.Succeeded || result.status === VolcTaskStatus.Failed) {
        await this.volcengineCallback(result)
      }
      return result
    }
    return aiLog.response as unknown as GetVideoGenerationTaskResponse
  }

  /**
   * Kling图生视频
   */
  async klingImage2Video(request: KlingImage2VideoRequestDto) {
    const { userId, userType, model_name, duration, mode, ...params } = request
    const pricing = await this.calculateVideoGenerationPrice({
      model: model_name,
      mode,
      duration: duration ? Number(duration) : undefined,
    })

    if (userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.klingService.createImage2VideoTask({
      ...params,
      mode,
      duration,
      callback_url: config.ai.kling.callbackUrl,
    })

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.data.task_id,
      model: model_name,
      channel: AiLogChannel.Kling,
      action: KlingAction.Image2video,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: { ...params, mode, duration },
      status: AiLogStatus.Generating,
    })

    return {
      ...result.data,
      task_id: aiLog.id,
    } as Image2VideoCreateTaskResponseData
  }

  /**
   * Kling多图生视频
   */
  async klingMultiImage2Video(request: KlingMultiImage2VideoRequestDto) {
    const { userId, userType, model_name, duration, mode, ...params } = request
    const pricing = await this.calculateVideoGenerationPrice({
      model: model_name,
      mode,
      duration: duration ? Number(duration) : undefined,
    })

    if (userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.klingService.createMultiImage2VideoTask({
      ...params,
      mode,
      duration,
      callback_url: config.ai.kling.callbackUrl,
    })

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.data.task_id,
      model: model_name,
      channel: AiLogChannel.Kling,
      action: KlingAction.MultiImage2video,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: { ...params, mode, duration },
      status: AiLogStatus.Generating,
    })

    return {
      ...result.data,
      task_id: aiLog.id,
    } as MultiImage2VideoCreateTaskResponseData
  }
}
