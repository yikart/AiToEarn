import type { DraftGenerationData } from '@yikart/aitoearn-queue'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AccountType, AppException, CreditsConsumptionSource, FileUtil, getErrorMessage, poll, ResponseCode, retry, UserType } from '@yikart/common'
import {
  AiLogChannel,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  AssetType,
  MaterialGroupRepository,
  MaterialRepository,
  MaterialSource,
  MaterialStatus,
  MaterialType,
  MediaRepository,
  MediaType,
} from '@yikart/mongodb'
import { z } from 'zod'
import { TaskStatus } from '../../common'
import { config } from '../../config'
import { AiAvailabilityService } from '../ai-availability'
import { ImageService } from '../ai/image/image.service'
import { calculatePricingPoints, ChatPricing } from '../ai/pricing/pricing-calculator'
import { VideoService } from '../ai/video/video.service'
import { DraftGenerationMemoryService } from './draft-generation-memory.service'
import { DraftGenerationPlannerService, ImageTextDraftPlanResult, VideoDraftPlanResult } from './draft-generation-planner.service'
import { getCompatibleAccountTypes } from './draft-generation-platforms'
import {
  CreateDraftFromVideoUrlDto,
  CreateDraftGenerationV2Dto,
  CreateImageTextDraftDto,
  DraftGenerationMemoryContentType,
  DraftType,
  ImageTextDraftType,
  ListDraftGenerationTasksDto,
  QueryDraftGenerationTasksDto,
} from './draft-generation.dto'
import { DraftGenerationPricingVoInput } from './draft-generation.vo'

export class DraftGenerationError extends Error {
  constructor(
    message: string,
    public readonly consumedPoints: number,
    cause?: unknown,
  ) {
    super(message, { cause })
    this.name = 'DraftGenerationError'
  }
}

const VideoDraftMetadataResultSchema = z.object({
  title: z.string().max(200).describe('TikTok video title'),
  description: z.string().max(2200).describe('TikTok video description'),
  topics: z.array(z.string()).max(5).describe('Hashtag topics without # prefix'),
})

interface ImageGenerationPrompt {
  prompt: string
  promptIndex: number
}

interface ImageGenerationErrorDetail {
  promptIndex: number
  errorMessage: string
}

type ImageGenerationProgressHandler = (imageUrl: string, points: number, imageGenerationErrors: ImageGenerationErrorDetail[]) => Promise<void>

enum ImageExecutionReferenceHandling {
  None = 'none',
  Reference = 'reference',
  Edit = 'edit',
  Ignored = 'ignored',
}

const OPENAI_IMAGE_DEFAULT_SIZE = '1024x1536'
const OPENAI_IMAGE_SQUARE_SIZE = '1024x1024'
const OPENAI_IMAGE_MAX_EDGE = 1536
const OPENAI_IMAGE_MAX_PIXELS = 1536 * 1024
const OPENAI_IMAGE_SIZE_MULTIPLE = 16
const OPENAI_IMAGE_MIN_ASPECT_RATIO = 1 / 3
const OPENAI_IMAGE_MAX_ASPECT_RATIO = 3

function getGreatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b !== 0) {
    const next = a % b
    a = b
    b = next
  }

  return a
}

interface ResolvedImageExecution {
  referenceHandling: ImageExecutionReferenceHandling
  resolvedSize?: string
  mode: 'gemini' | 'openai-generation' | 'openai-edit'
  channel: AiLogChannel
}

/** V2 视频草稿 AiLog.response */
interface V2DraftResponse {
  materialId?: string
  mediaId?: string
  title?: string
  description?: string
  topics?: string[]
  videoUrl?: string
  coverUrl?: string
  plan?: VideoDraftPlanResult
}

/** 图文草稿 AiLog.response */
interface ImageTextDraftResponse {
  materialId?: string
  mediaIds?: string[]
  title?: string
  description?: string
  topics?: string[]
  coverUrl?: string
  imageUrls?: string[]
  requestedImageCount?: number
  generatedImageCount?: number
  imageGenerationErrors?: ImageGenerationErrorDetail[]
  plan?: ImageTextDraftPlanResult
}

@Injectable()
export class DraftGenerationService {
  private readonly logger = new Logger(DraftGenerationService.name)

  constructor(
    private readonly materialGroupRepository: MaterialGroupRepository,
    private readonly materialRepository: MaterialRepository,
    private readonly aiLogRepository: AiLogRepository,
    private readonly queueService: QueueService,
    private readonly videoService: VideoService,
    private readonly assetsService: AssetsService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly aiAvailability: AiAvailabilityService,
    private readonly imageService: ImageService,
    private readonly mediaRepository: MediaRepository,
    private readonly draftGenerationPlannerService: DraftGenerationPlannerService,
    private readonly draftGenerationMemoryService: DraftGenerationMemoryService,
  ) { }

  async getTask(taskId: string, userId: string, userType: UserType) {
    const aiLog = await this.aiLogRepository.getByIdAndUserId(taskId, userId, userType)
    if (!aiLog) {
      throw new AppException(ResponseCode.AiLogNotFound)
    }
    return aiLog
  }

  async listTasks(dto: QueryDraftGenerationTasksDto, userId: string, userType: UserType) {
    return this.aiLogRepository.listByIdsAndUserId(dto.taskIds, userId, userType)
  }

  async listTasksWithPagination(dto: ListDraftGenerationTasksDto, userId: string, userType: UserType) {
    return this.aiLogRepository.listWithPagination({
      ...dto,
      userId,
      userType,
      type: AiLogType.DraftGeneration,
    })
  }

  async getStats(userId: string, userType: UserType) {
    const generatingCount = await this.aiLogRepository.countByUserIdAndStatus(
      userId,
      userType,
      AiLogType.DraftGeneration,
      AiLogStatus.Generating,
    )
    return { generatingCount }
  }

  private async assertUserCreditsSufficient(_userId: string, _userType: UserType, _requiredPoints: number): Promise<void> {
    return undefined
  }

  private async addDraftGenerationJob(data: DraftGenerationData): Promise<void> {
    const options = data.queuePriority == null ? undefined : { priority: data.queuePriority }
    if (
      data.queuePriority != null
      && data.queuePriority >= config.ai.draftGeneration.queue.lowPriorityMinPriority
    ) {
      await this.queueService.addLowPriorityDraftGenerationJob(data, options)
      return
    }

    await this.queueService.addDraftGenerationJob(data, options)
  }

  private getVideoDraftModelConfig(model: string) {
    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return modelConfig
  }

  private async resolveEstimatedVideoDuration(
    modelConfig: ReturnType<DraftGenerationService['getVideoDraftModelConfig']>,
    dto: Pick<CreateDraftGenerationV2Dto, 'duration' | 'videoUrls'>,
  ): Promise<number | undefined> {
    if (dto.duration != null) {
      return dto.duration
    }

    const referenceVideoUrl = dto.videoUrls?.[0]
    if (!referenceVideoUrl) {
      return modelConfig.defaults?.duration
    }

    const maxDuration = Math.max(...modelConfig.durations)
    if (!Number.isFinite(maxDuration)) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const metadata = await this.videoMetadataService.probeVideoMetadata(FileUtil.buildUrl(referenceVideoUrl))
    const metadataDuration = Number(metadata.duration)
    if (!Number.isFinite(metadataDuration) || metadataDuration <= 0) {
      throw new BadRequestException(`video duration is required and must be within ${maxDuration} seconds`)
    }

    return Math.min(Math.ceil(metadataDuration), maxDuration)
  }

  private async estimateSingleVideoDraftPoints(
    userId: string,
    userType: UserType,
    dto: Pick<CreateDraftGenerationV2Dto, 'model' | 'duration' | 'resolution' | 'aspectRatio' | 'videoUrls'>,
  ): Promise<number> {
    const modelConfig = this.getVideoDraftModelConfig(dto.model)
    const referenceVideoUrl = dto.videoUrls?.[0]
    const mode = referenceVideoUrl ? 'video2video' : undefined

    if (mode && !modelConfig.modes.includes(mode)) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const duration = await this.resolveEstimatedVideoDuration(modelConfig, dto)

    return this.videoService.calculateVideoGenerationPrice({
      model: dto.model,
      userId,
      userType,
      duration,
      resolution: dto.resolution,
      aspectRatio: dto.aspectRatio,
      mode,
    })
  }

  private async estimateVideoDraftSubmissionPoints(
    userId: string,
    userType: UserType,
    dto: CreateDraftGenerationV2Dto,
  ): Promise<number> {
    const singleTaskPoints = await this.estimateSingleVideoDraftPoints(userId, userType, dto)
    return singleTaskPoints * (dto.quantity ?? 1)
  }

  private getImageTextDraftModelConfig(model: string) {
    const modelConfig = config.ai.draftGeneration.imageModels.find(m => m.model === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return modelConfig
  }

  private getImageTextDraftPricingEntry(model: string, imageSize?: string) {
    const modelConfig = this.getImageTextDraftModelConfig(model)
    const pricingEntry = modelConfig.pricing.find(p => p.resolution === (imageSize ?? '1K')) ?? modelConfig.pricing[0]
    if (!pricingEntry) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingEntry
  }

  private estimateImageTextDraftSubmissionPoints(dto: CreateImageTextDraftDto): number {
    const pricingEntry = this.getImageTextDraftPricingEntry(dto.imageModel, dto.imageSize)
    return pricingEntry.pricePerImage * (dto.imageCount ?? 3) * (dto.quantity ?? 1)
  }

  private resolveOpenAIImageSize(aspectRatio?: string): string {
    if (!aspectRatio) {
      return OPENAI_IMAGE_DEFAULT_SIZE
    }

    const parts = aspectRatio.split(':')
    if (parts.length !== 2) {
      throw new BadRequestException('image aspectRatio must use WIDTH:HEIGHT')
    }

    const widthRatio = Number(parts[0])
    const heightRatio = Number(parts[1])
    if (!Number.isInteger(widthRatio) || !Number.isInteger(heightRatio) || widthRatio <= 0 || heightRatio <= 0) {
      throw new BadRequestException('image aspectRatio must use positive integer WIDTH:HEIGHT')
    }

    const ratio = widthRatio / heightRatio
    if (ratio < OPENAI_IMAGE_MIN_ASPECT_RATIO || ratio > OPENAI_IMAGE_MAX_ASPECT_RATIO) {
      throw new BadRequestException('image aspectRatio must be between 1:3 and 3:1')
    }

    if (widthRatio === heightRatio) {
      return OPENAI_IMAGE_SQUARE_SIZE
    }

    const divisor = getGreatestCommonDivisor(widthRatio, heightRatio)
    const reducedWidth = widthRatio / divisor
    const reducedHeight = heightRatio / divisor
    const maxScaleByEdge = Math.floor(OPENAI_IMAGE_MAX_EDGE / Math.max(reducedWidth, reducedHeight))
    const maxScaleByPixels = Math.floor(Math.sqrt(OPENAI_IMAGE_MAX_PIXELS / (reducedWidth * reducedHeight)))
    const maxScale = Math.min(maxScaleByEdge, maxScaleByPixels)
    const scale = Math.floor(maxScale / OPENAI_IMAGE_SIZE_MULTIPLE) * OPENAI_IMAGE_SIZE_MULTIPLE

    if (scale < OPENAI_IMAGE_SIZE_MULTIPLE) {
      throw new BadRequestException('image aspectRatio cannot be converted to a supported size')
    }

    return `${reducedWidth * scale}x${reducedHeight * scale}`
  }

  private resolveImageExecution(
    imageModel: string,
    referenceImageUrls: string[],
    aspectRatio?: string,
  ): ResolvedImageExecution {
    this.getImageTextDraftModelConfig(imageModel)

    const geminiImageModel = config.ai.models.chat.find(model =>
      model.name === imageModel
      && model.channel === AiLogChannel.Gemini
      && model.outputModalities.includes('image'),
    )
    const generationModel = config.ai.models.image.generation.find(model => model.name === imageModel)
    const editModel = config.ai.models.image.edit.find(model => model.name === imageModel)

    if (geminiImageModel && (generationModel || editModel)) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    if (geminiImageModel) {
      return {
        mode: 'gemini',
        channel: geminiImageModel.channel,
        referenceHandling: referenceImageUrls.length > 0 ? ImageExecutionReferenceHandling.Reference : ImageExecutionReferenceHandling.None,
      }
    }

    const resolvedSize = this.resolveOpenAIImageSize(aspectRatio)

    if (referenceImageUrls.length > 0 && editModel) {
      return {
        mode: 'openai-edit',
        channel: AiLogChannel.NewApi,
        referenceHandling: ImageExecutionReferenceHandling.Edit,
        resolvedSize,
      }
    }

    if (generationModel) {
      return {
        mode: 'openai-generation',
        channel: AiLogChannel.NewApi,
        referenceHandling: referenceImageUrls.length > 0 ? ImageExecutionReferenceHandling.Ignored : ImageExecutionReferenceHandling.None,
        resolvedSize,
      }
    }

    throw new AppException(ResponseCode.InvalidModel)
  }

  // ==================== V2: 固定管线（无 Agent） ====================

  /**
   * V2: 创建草稿生成任务（投递队列时标记 version=v2）
   * 支持选择视频模型、duration、aspectRatio
   */
  async createDraftsV2(userId: string, userType: UserType, dto: CreateDraftGenerationV2Dto): Promise<string[]> {
    const modelConfig = config.ai.models.video.generation.find(m => m.name === dto.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const resolution = dto.resolution ?? modelConfig.defaults?.resolution
    const resolvedGroupId = await this.resolveDraftGroupId(userId, dto.groupId)
    const draftType = dto.draftType ?? 'draft'
    const queuePriority = modelConfig.queuePriority
    const plannerModel = draftType === 'draft' ? dto.plannerModel ?? config.ai.draftGeneration.planner.defaultModel : undefined
    if (plannerModel && !config.ai.models.chat.some(model => model.name === plannerModel && model.scenes?.includes('draft-generation'))) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const estimatedPoints = await this.estimateVideoDraftSubmissionPoints(userId, userType, { ...dto, resolution })
    await this.assertUserCreditsSufficient(userId, userType, estimatedPoints)

    const quantity = dto.quantity ?? 1
    const aiLogIds: string[] = []

    for (let i = 0; i < quantity; i++) {
      const aiLog = await this.aiLogRepository.create({
        userId,
        userType,
        type: AiLogType.DraftGeneration,
        model: dto.model,
        channel: modelConfig.channel as AiLogChannel,
        status: AiLogStatus.Generating,
        startedAt: new Date(),
        points: 0,
        request: {
          groupId: resolvedGroupId,
          version: 'v2',
          model: dto.model,
          duration: dto.duration,
          resolution,
          aspectRatio: dto.aspectRatio,
          prompt: dto.prompt,
          captionPrompt: dto.captionPrompt,
          imageUrls: dto.imageUrls,
          videoUrls: dto.videoUrls,
          draftType,
          plannerModel,
          queuePriority,
        },
        response: {},
      })

      await this.addDraftGenerationJob({
        aiLogId: aiLog.id,
        userId,
        userType,
        groupId: resolvedGroupId,
        version: 'v2',
        prompt: dto.prompt,
        captionPrompt: dto.captionPrompt,
        imageUrls: dto.imageUrls,
        model: dto.model,
        duration: dto.duration,
        resolution,
        aspectRatio: dto.aspectRatio,
        videoUrls: dto.videoUrls,
        draftType,
        platforms: dto.platforms,
        plannerModel,
        disableMemory: dto.disableMemory,
        queuePriority,
      })

      aiLogIds.push(aiLog.id)
    }

    return aiLogIds
  }

  /**
   * V2: 固定管线执行草稿内容生成（由 Consumer 调用）
   *
   * 流程：
   * 1. 规划模型生成视频 prompt + 元数据
   * 2. 调用视频模型生成视频
   * 3. 截帧生成封面
   * 4. 保存素材 + 更新 AiLog
   *
   * 积分由 ChatService 和各 VideoService 内部自动扣除
   */
  async generateContentV2(
    aiLogId: string,
    userId: string,
    userType: UserType,
    groupId: string,
    options?: {
      prompt?: string
      captionPrompt?: string
      imageUrls?: string[]
      model?: string
      duration?: number
      resolution?: string
      aspectRatio?: string
      videoUrls?: string[]
      draftType?: DraftType
      platforms?: string[]
      plannerModel?: string
      disableMemory?: boolean
    },
  ): Promise<{ consumedPoints: number }> {
    let consumedPoints = 0
    const startTime = Date.now()
    const draftType = options?.draftType ?? 'draft'

    const existingAiLog = await this.aiLogRepository.getById(aiLogId)
    const existing = (existingAiLog?.response ?? {}) as V2DraftResponse

    try {
      const candidateImageUrls = options?.imageUrls ?? []
      const model = options?.model ?? 'grok-imagine-video'
      const duration = options?.duration
      const aspectRatio = options?.aspectRatio ?? '9:16'
      const resolution = options?.resolution

      let plan: VideoDraftPlanResult | undefined
      let videoPrompt = options?.prompt ?? ''
      if (draftType === 'draft') {
        if (existing.plan?.videoPrompt) {
          plan = existing.plan
          this.logger.log({ aiLogId }, 'V2: Reusing plan from previous attempt')
        }
        else {
          const memoryItems = options?.disableMemory
            ? []
            : (await this.draftGenerationMemoryService.getPlannerMemoryContext(userId, DraftGenerationMemoryContentType.Video)).memoryItems
          const planned = await this.draftGenerationPlannerService.planVideo({
            userId,
            contentType: DraftGenerationMemoryContentType.Video,
            plannerModel: options?.plannerModel,
            userPrompt: options?.prompt,
            captionPrompt: options?.captionPrompt,
            memoryItems,
            referenceImageUrls: candidateImageUrls,
            referenceVideoUrls: options?.videoUrls,
            platforms: options?.platforms,
            model,
            duration,
            aspectRatio,
          })
          plan = planned.plan

          await this.aiLogRepository.updateById(aiLogId, {
            $set: { 'response.plan': plan, 'request.plannerModel': planned.model },
          })
        }
        videoPrompt = plan.videoPrompt
      }

      // 视频 + 封面：复用已有结果或重新生成（一起保存，不可分开）
      let videoUrl: string
      let coverUrl: string
      if (existing.videoUrl && existing.coverUrl) {
        videoUrl = existing.videoUrl
        coverUrl = existing.coverUrl
        this.logger.log({ aiLogId }, 'V2: Reusing video+cover from previous attempt')
      }
      else {
        const { videoUrl: generatedVideoUrl, points: videoPoints } = await this.generateVideo(
          aiLogId,
          userId,
          userType,
          model,
          videoPrompt,
          candidateImageUrls.length > 0 ? candidateImageUrls : undefined,
          duration,
          resolution,
          aspectRatio,
          options?.videoUrls?.[0],
        )
        consumedPoints += videoPoints

        const fullVideoUrl = FileUtil.buildUrl(generatedVideoUrl)
        const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(fullVideoUrl, 2)
        const uploadResult = await this.assetsService.uploadFromBuffer(userId, thumbnailBuffer, {
          type: AssetType.VideoThumbnail,
          mimeType: 'image/png',
          filename: 'thumbnail.png',
        })

        videoUrl = generatedVideoUrl
        coverUrl = uploadResult.asset.path

        await this.aiLogRepository.updateById(aiLogId, {
          $set: { 'response.videoUrl': videoUrl, 'response.coverUrl': coverUrl },
        })
      }

      if (draftType === 'video') {
        const mediaId = existing.mediaId ?? (await this.mediaRepository.create({
          userId,
          userType,
          materialGroupId: groupId,
          type: MediaType.VIDEO,
          url: videoUrl,
          thumbUrl: coverUrl,
        })).id

        const response: V2DraftResponse = {
          mediaId,
          videoUrl,
          coverUrl,
        }
        await this.aiLogRepository.updateById(aiLogId, {
          $set: {
            status: AiLogStatus.Success,
            model,
            points: consumedPoints,
            duration: Date.now() - startTime,
            response,
          },
        })

        return { consumedPoints }
      }

      const draftPlan = plan!

      // draft 类型：复用已有 materialId 或创建新素材
      const materialId = existing.materialId ?? (await this.materialRepository.create({
        userId,
        userType,
        groupId,
        type: MaterialType.VIDEO,
        source: MaterialSource.PlaceDraft,
        status: MaterialStatus.SUCCESS,
        title: draftPlan.title,
        desc: draftPlan.description,
        topics: draftPlan.topics,
        coverUrl,
        mediaList: [{ url: videoUrl, type: MediaType.VIDEO, thumbUrl: coverUrl }],
        useCount: 0,
        autoDeleteMedia: false,
        model,
        generationParams: options,
        accountTypes: (options?.platforms as AccountType[]) ?? getCompatibleAccountTypes({
          type: 'video',
          title: draftPlan.title,
          desc: draftPlan.description,
          topics: draftPlan.topics,
          duration,
          aspectRatio,
        }),
      })).id

      const response: V2DraftResponse = {
        materialId,
        title: draftPlan.title,
        description: draftPlan.description,
        topics: draftPlan.topics,
        videoUrl,
        coverUrl,
        plan: draftPlan,
      }

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Success,
          model,
          points: consumedPoints,
          duration: Date.now() - startTime,
          response,
        },
      })

      return { consumedPoints }
    }
    catch (error) {
      this.logger.error(error, `v2 generateContentV2 failed aiLogId=${aiLogId}, userId=${userId}, groupId=${groupId}, consumedPoints=${consumedPoints}`)
      throw new DraftGenerationError(
        getErrorMessage(error),
        consumedPoints,
        error,
      )
    }
  }

  /**
   * V2 辅助方法：使用 Grok 生成视频并轮询结果
   */
  private async generateVideo(
    aiLogId: string,
    userId: string,
    userType: UserType,
    model: string,
    videoPrompt: string,
    imageUrls?: string[],
    duration?: number,
    resolution?: string,
    aspectRatio?: string,
    videoUrl?: string,
  ): Promise<{ videoUrl: string, points: number }> {
    let task: { id: string, points: number }
    try {
      task = await this.videoService.userVideoGeneration({
        userId,
        userType,
        model,
        prompt: videoPrompt,
        image: imageUrls,
        video_url: videoUrl,
        duration,
        resolution,
        ratio: aspectRatio,
        source: CreditsConsumptionSource.AiDraftGeneration,
        metadata: { aspectRatio, resolution },
      })
    }
    catch (error) {
      const errorMessage = getErrorMessage(error)
      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Failed,
          errorMessage,
        },
      })
      throw error
    }

    this.logger.log({ aiLogId, taskId: task.id, model, duration, aspectRatio }, 'V2: video generation started')

    const url = await poll<string>(
      async () => {
        const result = await this.videoService.getVideoTaskStatus({ taskId: task.id, userId, userType })
        if (result.status === TaskStatus.Success) {
          return { done: true, data: result.videoUrl }
        }
        if (result.status === TaskStatus.Failure) {
          return { done: true, error: result.error?.message }
        }
        return { done: false }
      },
      { taskName: `Video generation (${model})` },
    )

    return { videoUrl: url, points: task.points }
  }

  // ==================== 图文草稿生成 ====================

  getDraftGenerationPricing(): DraftGenerationPricingVoInput {
    const imageModels = config.ai.draftGeneration.imageModels

    const videoModels = config.ai.models.video.generation
      .filter(v => v.channel === AiLogChannel.Grok)

    return { imageModels, videoModels }
  }

  /**
   * 创建图文草稿生成任务（同步阶段）
   */
  async createImageTextDrafts(userId: string, userType: UserType, dto: CreateImageTextDraftDto): Promise<string[]> {
    const resolvedGroupId = await this.resolveDraftGroupId(userId, dto.groupId)
    const draftType = dto.draftType ?? 'draft'
    const plannerModel = draftType === 'draft' ? dto.plannerModel ?? config.ai.draftGeneration.planner.defaultModel : undefined
    if (plannerModel && !config.ai.models.chat.some(model => model.name === plannerModel && model.scenes?.includes('draft-generation'))) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const estimatedPoints = this.estimateImageTextDraftSubmissionPoints(dto)
    await this.assertUserCreditsSufficient(userId, userType, estimatedPoints)

    const imageModelConfig = this.getImageTextDraftModelConfig(dto.imageModel)
    const runtimeImageModel = imageModelConfig.runtimeModel ?? dto.imageModel
    const queuePriority = imageModelConfig.queuePriority
    const imageExecution = this.resolveImageExecution(dto.imageModel, dto.imageUrls ?? [], dto.aspectRatio)
    const channel = imageExecution.channel

    const quantity = dto.quantity ?? 1
    const aiLogIds: string[] = []

    for (let i = 0; i < quantity; i++) {
      const aiLog = await this.aiLogRepository.create({
        userId,
        userType,
        type: AiLogType.DraftGeneration,
        model: dto.imageModel,
        channel,
        status: AiLogStatus.Generating,
        startedAt: new Date(),
        points: 0,
        request: {
          groupId: resolvedGroupId,
          version: 'v2-image-text',
          imageModel: dto.imageModel,
          imageCount: dto.imageCount,
          imageSize: dto.imageSize,
          aspectRatio: dto.aspectRatio,
          prompt: dto.prompt,
          captionPrompt: dto.captionPrompt,
          imageUrls: dto.imageUrls,
          draftType,
          plannerModel,
          runtimeImageModel,
          queuePriority,
          imageExecution,
        },
        response: {},
      })

      await this.addDraftGenerationJob({
        aiLogId: aiLog.id,
        userId,
        userType,
        groupId: resolvedGroupId,
        version: 'v2-image-text',
        prompt: dto.prompt,
        captionPrompt: dto.captionPrompt,
        imageUrls: dto.imageUrls,
        imageModel: dto.imageModel,
        imageCount: dto.imageCount ?? 3,
        imageSize: dto.imageSize,
        aspectRatio: dto.aspectRatio,
        imageTextDraftType: draftType,
        platforms: dto.platforms,
        plannerModel,
        disableMemory: dto.disableMemory,
        queuePriority,
      })

      aiLogIds.push(aiLog.id)
    }

    return aiLogIds
  }

  /**
   * 图文草稿内容生成（异步阶段，由 Consumer 调用）
   *
   * 流程：
   * 1. 规划模型生成 title / description / topics / imagePrompts
   * 2. 根据 imageModel 批量生成图片（Gemini 或 GPT Image）
   * 3. 保存素材（类型 ARTICLE）+ 更新 AiLog
   */
  async generateContentImageText(
    aiLogId: string,
    userId: string,
    userType: UserType,
    groupId: string,
    options: {
      prompt: string
      captionPrompt?: string
      imageUrls?: string[]
      imageModel: string
      imageCount: number
      imageSize?: string
      aspectRatio?: string
      draftType?: ImageTextDraftType
      platforms?: string[]
      plannerModel?: string
      disableMemory?: boolean
    },
  ): Promise<{ consumedPoints: number }> {
    const existingAiLog = await this.aiLogRepository.getById(aiLogId)
    const existing = (existingAiLog?.response ?? {}) as ImageTextDraftResponse
    let consumedPoints = existingAiLog?.points ?? 0
    const startTime = Date.now()
    const draftType = options.draftType ?? 'draft'
    const targetImageCount = options.imageCount

    try {
      const referenceImageUrls = options.imageUrls ?? []
      const imageExecution = this.resolveImageExecution(options.imageModel, referenceImageUrls, options.aspectRatio)
      this.logger.log(
        {
          aiLogId,
          imageModel: options.imageModel,
          imageCount: options.imageCount,
          aspectRatio: options.aspectRatio,
          refImageCount: referenceImageUrls.length,
          draftType,
          referenceHandling: imageExecution.referenceHandling,
          resolvedSize: imageExecution.resolvedSize,
        },
        'ImageText: Starting generation',
      )

      let plan: ImageTextDraftPlanResult | undefined
      let imagePromptTasks: ImageGenerationPrompt[]
      if (draftType === 'image') {
        imagePromptTasks = Array.from({ length: targetImageCount }, (_, promptIndex) => ({
          prompt: options.prompt,
          promptIndex,
        }))
      }
      else {
        const existingPlan = existing.plan
        if (existingPlan && existingPlan.imagePrompts.length >= targetImageCount) {
          plan = existingPlan
          this.logger.log({ aiLogId }, 'ImageText: Reusing plan from previous attempt')
        }
        else {
          const memoryItems = options.disableMemory
            ? []
            : (await this.draftGenerationMemoryService.getPlannerMemoryContext(userId, DraftGenerationMemoryContentType.ImageText)).memoryItems
          const planned = await this.draftGenerationPlannerService.planImageText({
            userId,
            contentType: DraftGenerationMemoryContentType.ImageText,
            plannerModel: options.plannerModel,
            userPrompt: options.prompt,
            captionPrompt: options.captionPrompt,
            memoryItems,
            referenceImageUrls,
            platforms: options.platforms,
            imageModel: options.imageModel,
            imageCount: targetImageCount,
            imageSize: options.imageSize,
            aspectRatio: options.aspectRatio,
          })
          plan = planned.plan

          await this.aiLogRepository.updateById(aiLogId, {
            $set: { 'response.plan': plan, 'request.plannerModel': planned.model },
          })

          this.logger.log(
            { aiLogId, title: plan.title, imagePromptsCount: plan.imagePrompts.length, plannerModel: planned.model },
            'ImageText: Planning completed',
          )
        }

        imagePromptTasks = plan.imagePrompts
          .slice(0, targetImageCount)
          .map((prompt, promptIndex) => ({ prompt, promptIndex }))
      }
      let generatedImageUrls = (existing.imageUrls ?? []).slice(0, targetImageCount)
      const updateImageProgress = async (
        imageUrls: string[],
        points: number,
        imageGenerationErrors: ImageGenerationErrorDetail[] = [],
      ) => {
        const response: Record<string, unknown> = {
          'points': points,
          'response.imageUrls': [...imageUrls],
          'response.requestedImageCount': targetImageCount,
          'response.generatedImageCount': imageUrls.length,
          'response.imageGenerationErrors': [...imageGenerationErrors],
        }
        if (plan) {
          response['response.plan'] = plan
        }
        await this.aiLogRepository.updateById(aiLogId, {
          $set: response,
        })
      }

      if (generatedImageUrls.length > 0) {
        this.logger.log({ aiLogId, count: generatedImageUrls.length, targetImageCount }, 'ImageText: Reusing images from previous attempt')
      }

      if (generatedImageUrls.length < targetImageCount) {
        const missingPromptTasks = imagePromptTasks.slice(generatedImageUrls.length, targetImageCount)
        const previousGeneratedImageCount = generatedImageUrls.length
        const progressImageUrls = [...generatedImageUrls]
        const { urls, points: imagePoints, imageGenerationErrors } = await this.generateImages(
          userId,
          userType,
          options.imageModel,
          missingPromptTasks,
          imageExecution,
          referenceImageUrls,
          options.aspectRatio,
          options.imageSize,
          async (imageUrl, points, imageGenerationErrors) => {
            if (progressImageUrls.length < targetImageCount) {
              progressImageUrls.push(imageUrl)
            }
            await updateImageProgress(progressImageUrls, consumedPoints + points, [
              ...(existing.imageGenerationErrors ?? []),
              ...imageGenerationErrors,
            ])
          },
        )
        generatedImageUrls = progressImageUrls.length > previousGeneratedImageCount
          ? progressImageUrls.slice(0, targetImageCount)
          : [...generatedImageUrls, ...urls].slice(0, targetImageCount)
        consumedPoints += imagePoints

        await updateImageProgress(generatedImageUrls, consumedPoints, imageGenerationErrors)

        this.logger.log(
          { aiLogId, generatedCount: generatedImageUrls.length, targetImageCount, imagePoints, errorCount: imageGenerationErrors.length },
          'ImageText: Image generation completed',
        )

        if (generatedImageUrls.length < targetImageCount) {
          throw new Error(`ImageText: generated ${generatedImageUrls.length}/${targetImageCount} images`)
        }
      }

      if (draftType === 'image') {
        const mediaIds = (existing.mediaIds ?? []).slice(0, targetImageCount)
        for (const imageUrl of generatedImageUrls.slice(mediaIds.length)) {
          const media = await this.mediaRepository.create({
            userId,
            userType,
            materialGroupId: groupId,
            type: MediaType.IMG,
            url: imageUrl,
          })
          mediaIds.push(media.id)
        }

        const response: ImageTextDraftResponse = {
          mediaIds,
          imageUrls: generatedImageUrls,
          requestedImageCount: targetImageCount,
          generatedImageCount: generatedImageUrls.length,
        }
        await this.aiLogRepository.updateById(aiLogId, {
          $set: {
            status: AiLogStatus.Success,
            model: options.imageModel,
            points: consumedPoints,
            duration: Date.now() - startTime,
            response,
          },
        })

        return { consumedPoints }
      }

      // draft 类型：复用已有 materialId 或创建新素材
      const coverUrl = generatedImageUrls[0]
      const draftPlan = plan!

      const materialId = existing.materialId ?? (await this.materialRepository.create({
        userId,
        userType,
        groupId,
        type: MaterialType.ARTICLE,
        source: MaterialSource.PlaceDraft,
        status: MaterialStatus.SUCCESS,
        title: draftPlan.title,
        desc: draftPlan.description,
        topics: draftPlan.topics,
        coverUrl,
        mediaList: generatedImageUrls.map(url => ({ url, type: MediaType.IMG })),
        useCount: 0,
        autoDeleteMedia: false,
        model: options.imageModel,
        generationParams: {
          model: options.imageModel,
          ...options,
        },
        accountTypes: (options.platforms as AccountType[]) ?? getCompatibleAccountTypes({
          type: 'article',
          title: draftPlan.title,
          desc: draftPlan.description,
          topics: draftPlan.topics,
          imageCount: generatedImageUrls.length,
          aspectRatio: options.aspectRatio,
        }),
      })).id

      const response: ImageTextDraftResponse = {
        materialId,
        title: draftPlan.title,
        description: draftPlan.description,
        topics: draftPlan.topics,
        coverUrl,
        imageUrls: generatedImageUrls,
        requestedImageCount: targetImageCount,
        generatedImageCount: generatedImageUrls.length,
        plan: draftPlan,
      }

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Success,
          model: options.imageModel,
          points: consumedPoints,
          duration: Date.now() - startTime,
          response,
        },
      })

      return { consumedPoints }
    }
    catch (error) {
      this.logger.error(error, `v2 generateContentImageText failed aiLogId=${aiLogId}, userId=${userId}, groupId=${groupId}, consumedPoints=${consumedPoints}`)
      throw new DraftGenerationError(
        getErrorMessage(error),
        consumedPoints,
        error,
      )
    }
  }

  /**
   * 根据模型类型批量生成图片
   */
  private async generateImages(
    userId: string,
    userType: UserType,
    imageModel: string,
    imagePrompts: ImageGenerationPrompt[],
    imageExecution: ResolvedImageExecution,
    referenceImageUrls: string[],
    aspectRatio?: string,
    imageSize?: string,
    onImageGenerated?: ImageGenerationProgressHandler,
  ): Promise<{ urls: string[], points: number, imageGenerationErrors: ImageGenerationErrorDetail[] }> {
    if (imageExecution.mode === 'gemini') {
      return this.generateImagesWithGemini(userId, userType, imageModel, imagePrompts, referenceImageUrls, aspectRatio, imageSize, onImageGenerated)
    }

    return this.generateImagesWithOpenAI(userId, userType, imageModel, imagePrompts, imageExecution, referenceImageUrls, imageSize, onImageGenerated)
  }

  /**
   * 使用 Gemini 模型（nb2/nb-pro）批量生成图片
   * 注意：userGeminiGeneration 内部已自动扣费和记录 AiLog
   */
  private async generateImagesWithGemini(
    userId: string,
    userType: UserType,
    model: string,
    imagePrompts: ImageGenerationPrompt[],
    referenceImageUrls: string[],
    aspectRatio?: string,
    imageSize?: string,
    onImageGenerated?: ImageGenerationProgressHandler,
  ): Promise<{ urls: string[], points: number, imageGenerationErrors: ImageGenerationErrorDetail[] }> {
    const urls: string[] = []
    const imageGenerationErrors: ImageGenerationErrorDetail[] = []
    let totalPoints = 0

    for (const { prompt, promptIndex } of imagePrompts) {
      this.logger.log(
        { model, promptIndex, promptLength: prompt.length, aspectRatio, imageSize },
        'ImageText: Generating image with Gemini',
      )

      try {
        const result = await retry(
          () => this.imageService.userGeminiGeneration({
            userId,
            userType,
            model: model as 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview',
            prompt,
            imageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
            source: CreditsConsumptionSource.AiDraftGeneration,
            ...(imageSize ? { imageSize: imageSize as '1K' | '2K' | '4K' } : {}),
            ...(aspectRatio ? { aspectRatio: aspectRatio as '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' } : {}),
          }),
          {
            maxRetries: 3,
            delayMs: 1000,
            onRetry: (error, attempt) => {
              this.logger.warn(
                error,
                `ImageText: Gemini image generation failed, retrying promptIndex=${promptIndex}, attempt=${attempt}`,
              )
            },
          },
        )

        const remainingSlots = imagePrompts.length - urls.length
        if (remainingSlots <= 0) {
          break
        }

        totalPoints += result.usage?.points ?? 0
        if (result.images.length > 0) {
          const generatedUrls = result.images.slice(0, remainingSlots).map(image => image.url)
          for (const imageUrl of generatedUrls) {
            urls.push(imageUrl)
            await onImageGenerated?.(imageUrl, totalPoints, imageGenerationErrors)
          }
        }

        if (urls.length >= imagePrompts.length) {
          break
        }
      }
      catch (error) {
        imageGenerationErrors.push({
          promptIndex,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        this.logger.warn(
          error,
          `ImageText: Failed to generate image after retries, skipping promptIndex=${promptIndex}`,
        )
      }
    }

    return { urls, points: totalPoints, imageGenerationErrors }
  }

  private async generateImagesWithOpenAI(
    userId: string,
    userType: UserType,
    model: string,
    imagePrompts: ImageGenerationPrompt[],
    imageExecution: ResolvedImageExecution,
    referenceImageUrls: string[],
    imageSize?: string,
    onImageGenerated?: ImageGenerationProgressHandler,
  ): Promise<{ urls: string[], points: number, imageGenerationErrors: ImageGenerationErrorDetail[] }> {
    const urls: string[] = []
    const imageGenerationErrors: ImageGenerationErrorDetail[] = []
    const pricePerImage = this.getImageTextDraftPricingEntry(model, imageSize).pricePerImage
    let totalPoints = 0

    for (const { prompt, promptIndex } of imagePrompts) {
      this.logger.log(
        {
          model,
          promptIndex,
          promptLength: prompt.length,
          resolvedSize: imageExecution.resolvedSize,
          referenceHandling: imageExecution.referenceHandling,
        },
        'ImageText: Generating image with standard image service',
      )

      try {
        const result = await retry(
          async () => {
            if (imageExecution.mode === 'openai-edit') {
              if (referenceImageUrls.length === 0) {
                throw new Error('ImageText: missing reference images for edit mode')
              }

              return this.imageService.userEdit({
                userId,
                userType,
                model,
                image: referenceImageUrls,
                prompt,
                n: 1,
                size: imageExecution.resolvedSize,
                source: CreditsConsumptionSource.AiDraftGeneration,
              })
            }

            return this.imageService.userGeneration({
              userId,
              userType,
              model,
              prompt,
              n: 1,
              size: imageExecution.resolvedSize,
              source: CreditsConsumptionSource.AiDraftGeneration,
            })
          },
          {
            maxRetries: 3,
            delayMs: 1000,
            onRetry: (error, attempt) => {
              this.logger.warn(
                error,
                `ImageText: Standard image generation failed, retrying promptIndex=${promptIndex}, attempt=${attempt}`,
              )
            },
          },
        )

        const remainingSlots = imagePrompts.length - urls.length
        if (remainingSlots <= 0) {
          break
        }

        const generatedUrls = result.list
          .map(item => item.url)
          .filter((url): url is string => !!url)

        if (generatedUrls.length > 0) {
          for (const imageUrl of generatedUrls.slice(0, remainingSlots)) {
            urls.push(imageUrl)
            await onImageGenerated?.(imageUrl, totalPoints + pricePerImage, imageGenerationErrors)
          }
        }
        totalPoints += pricePerImage

        if (urls.length >= imagePrompts.length) {
          break
        }
      }
      catch (error) {
        imageGenerationErrors.push({
          promptIndex,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        this.logger.warn(
          error,
          `ImageText: Failed to generate image after retries, skipping promptIndex=${promptIndex}`,
        )
      }
    }

    return { urls, points: totalPoints, imageGenerationErrors }
  }

  /**
   * 视频 URL 生成草稿：使用 Gemini 多模态模型分析视频内容，生成文案并保存草稿
   *
   * 流程：
   * 1. 解析素材组（默认草稿箱）
   * 2. Gemini Flash 分析视频 URL → 生成 title / description / topics
   * 3. 从视频截帧生成封面
   * 4. 保存 Material 草稿
   */
  async generateDraftFromVideoUrl(
    userId: string,
    userType: UserType,
    dto: CreateDraftFromVideoUrlDto,
  ): Promise<{ materialId: string }> {
    const resolvedGroupId = await this.resolveDraftGroupId(userId, dto.groupId)
    const modelName = 'gemini-3-flash-preview'
    const startedAt = new Date()
    const fullVideoUrl = FileUtil.buildUrl(dto.videoUrl)

    const prompt = `You are a TikTok content generation assistant.
## Task
Watch the video and generate TikTok post metadata based on its content.

## Instructions
- **title**: Catchy title under 30 characters, in the language that best matches the video content
- **description**: Engaging description with call-to-action, under 2200 characters, in the language matching the video content
- **topics**: 3-5 relevant hashtags (without # prefix)
- **IMPORTANT**: Do NOT generate any content featuring children, minors, or anyone appearing under 18.
Return the result as JSON.`

    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: config.ai.gemini.apiKey,
      baseUrl: config.ai.gemini.baseUrl,
      temperature: 1.0,
    })

    const messageContent: Array<
      { type: 'video', url: string }
      | { type: 'text', text: string }
    > = [
      { type: 'video', url: fullVideoUrl },
      { type: 'text', text: prompt },
    ]

    const structuredModel = model.withStructuredOutput(z.toJSONSchema(VideoDraftMetadataResultSchema), { includeRaw: true })
    const { raw, parsed: structuredResult } = await this.aiAvailability.execute(
      { provider: 'gemini', operation: 'draftGeneration.generateDraftFromVideoUrl', model: modelName },
      async () => structuredModel.invoke([
        new HumanMessage({ content: messageContent }),
      ]),
    )

    if (!structuredResult) {
      throw new Error('VideoUrl: No response from Gemini')
    }

    const parsed = z.safeParse(VideoDraftMetadataResultSchema, structuredResult)
    if (!parsed.success) {
      throw new Error(`VideoUrl: Invalid plan result: ${z.prettifyError(parsed.error)}`)
    }

    const plan = parsed.data
    const usage = AIMessage.isInstance(raw) ? raw.usage_metadata : undefined
    const chatModel = config.ai.models.chat.find(m => m.name === modelName)
    if (chatModel && usage) {
      const pricing = chatModel.pricing as ChatPricing
      const consumedPoints = calculatePricingPoints(pricing, usage)
      const duration = Date.now() - startedAt.getTime()

      await this.aiLogRepository.create({
        userId,
        userType,
        type: AiLogType.Agent,
        model: modelName,
        channel: AiLogChannel.Gemini,
        startedAt,
        duration,
        points: consumedPoints,
        request: { videoUrl: dto.videoUrl },
        response: plan,
        status: AiLogStatus.Success,
      })
    }

    this.logger.log({ plan }, 'VideoUrl: Plan generated')

    let coverUrl: string | undefined
    try {
      const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(fullVideoUrl, 2)
      const uploadResult = await this.assetsService.uploadFromBuffer(userId, thumbnailBuffer, {
        type: AssetType.VideoThumbnail,
        mimeType: 'image/png',
        filename: 'thumbnail.png',
      })
      coverUrl = uploadResult.asset.path
    }
    catch (error) {
      this.logger.warn(error, `VideoUrl: Failed to extract video thumbnail, proceeding without cover videoUrl=${dto.videoUrl}`)
    }

    const material = await this.materialRepository.create({
      userId,
      userType,
      groupId: resolvedGroupId,
      type: MaterialType.VIDEO,
      source: MaterialSource.PlaceDraft,
      status: MaterialStatus.SUCCESS,
      title: plan.title,
      desc: plan.description,
      topics: plan.topics,
      coverUrl,
      mediaList: [{ url: dto.videoUrl, type: MediaType.VIDEO, thumbUrl: coverUrl }],
      useCount: 0,
      autoDeleteMedia: false,
      model: modelName,
      generationParams: {
        model: modelName,
        videoUrl: dto.videoUrl,
      },
      accountTypes: dto.platforms ?? getCompatibleAccountTypes({
        type: 'video',
        title: plan.title,
        desc: plan.description,
        topics: plan.topics,
      }),
    })

    return { materialId: material.id }
  }

  private async resolveDraftGroupId(userId: string, groupId?: string): Promise<string> {
    if (groupId) {
      const group = await this.materialGroupRepository.getInfo(groupId)
      if (!group || group.userId !== userId) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
      return group.id
    }

    const defaultGroup = await this.materialGroupRepository.getDefaultGroup(userId)
    if (!defaultGroup) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }

    return defaultGroup.id
  }
}
