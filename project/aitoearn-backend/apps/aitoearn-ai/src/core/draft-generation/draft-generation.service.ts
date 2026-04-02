import { McpServerConfig } from '@anthropic-ai/claude-agent-sdk'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AccountType, AppException, FileUtil, getErrorMessage, poll, ResponseCode, retry, UserType } from '@yikart/common'
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
  UserRepository,
} from '@yikart/mongodb'
import { z } from 'zod'
import { TaskStatus } from '../../common'
import { config } from '../../config'
import { McpServerName } from '../agent/agent.constants'
import { AgentService } from '../agent/agent.service'
import { MediaMcp } from '../agent/mcp/media.mcp'
import { UtilMcp } from '../agent/mcp/util.mcp'
import { VideoUtilsMcp } from '../agent/mcp/video-utils.mcp'
import { ImageService } from '../ai/image/image.service'
import { calculatePricingPoints, ChatPricing } from '../ai/pricing/pricing-calculator'
import { VideoService } from '../ai/video/video.service'
import { getCompatibleAccountTypes } from '../material-adaptation/material-adaptation.constants'
import { DRAFT_GENERATION_SYSTEM_PROMPT } from './draft-generation.constants'
import {
  CreateDraftGenerationV2Dto,
  CreateImageTextDraftDto,
  DraftType,
  ImageTextDraftType,
  ListDraftGenerationTasksDto,
  QueryDraftGenerationTasksDto,
} from './draft-generation.dto'
import { DraftGenerationPricingVoInput, DraftGenerationResult, DraftGenerationResultSchema } from './draft-generation.vo'

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

/** V2 Gemini 规划步骤的输出 schema（仅负责描述和话题生成，不影响视频生成） */
const V2PlanResultSchema = z.object({
  title: z.string().max(200).describe('TikTok video title'),
  description: z.string().max(2200).describe('TikTok video description'),
  topics: z.array(z.string()).max(5).describe('Hashtag topics without # prefix'),
})

type V2PlanResult = z.infer<typeof V2PlanResultSchema>

/** 图文草稿规划步骤的输出 schema（包含每张图片的生成 prompt） */
const ImageTextPlanResultSchema = z.object({
  title: z.string().max(200).describe('Post title'),
  description: z.string().max(2200).describe('Post description/caption'),
  topics: z.array(z.string()).max(5).describe('Hashtag topics without # prefix'),
  imagePrompts: z.array(z.string().max(1000)).describe('Prompt for each image to generate'),
})

type ImageTextPlanResult = z.infer<typeof ImageTextPlanResultSchema>

interface TextContent { type: 'text', text: string }
interface ImageContent { type: 'image', source: { type: 'url', url: string } }
type MessageContent = TextContent | ImageContent

interface RunningGenerationTask {
  aiLogId: string
  abortController: AbortController
  completionPromise: Promise<void>
}

@Injectable()
export class DraftGenerationService implements OnModuleDestroy {
  private readonly logger = new Logger(DraftGenerationService.name)
  private readonly runningGenerations = new Map<string, RunningGenerationTask>()

  constructor(
    private readonly materialGroupRepository: MaterialGroupRepository,
    private readonly materialRepository: MaterialRepository,
    private readonly aiLogRepository: AiLogRepository,
    private readonly mediaMcp: MediaMcp,
    private readonly utilMcp: UtilMcp,
    private readonly videoUtilsMcp: VideoUtilsMcp,
    private readonly agentService: AgentService,
    private readonly queueService: QueueService,
    private readonly userRepository: UserRepository,
    private readonly videoService: VideoService,
    private readonly assetsService: AssetsService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly imageService: ImageService,
    private readonly mediaRepository: MediaRepository,
  ) { }

  /** 优雅关机：等待所有正在运行的生成任务完成后再销毁模块 */
  async onModuleDestroy() {
    this.logger.debug('DraftGenerationService is shutting down, waiting for running tasks')

    const runningTasks = Array.from(this.runningGenerations.values())

    if (runningTasks.length > 0) {
      this.logger.log(`Waiting for ${runningTasks.length} running generation tasks`)

      const waitPromises = runningTasks.map(task =>
        task.completionPromise
          .then(() => {
            this.logger.log(`Draft ${task.aiLogId} completed during shutdown`)
          })
          .catch((error) => {
            this.logger.error({ error, aiLogId: task.aiLogId }, `Draft generation failed during shutdown`)
          }),
      )

      await Promise.all(waitPromises)
    }

    this.logger.debug('DraftGenerationService shutdown complete')
  }

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

  /**
   * 执行草稿内容生成（异步阶段，由 DraftGenerationConsumer 调用）
   *
   * 流程：注册运行中任务 → 获取品牌数据 → 调用 Claude Agent 生成视频 → 保存素材 → 扣积分 → 更新状态
   */
  async generateContent(aiLogId: string, userId: string, userType: UserType, groupId: string): Promise<{ consumedPoints: number }> {
    // 创建 completionPromise 用于优雅关机时等待任务完成
    let completionResolver: () => void
    const completionPromise = new Promise<void>((resolve) => {
      completionResolver = resolve
    })

    // 注册为运行中任务，支持 AbortController 取消和关机等待
    const abortController = new AbortController()
    const taskInfo: RunningGenerationTask = {
      aiLogId,
      abortController,
      completionPromise,
    }
    this.runningGenerations.set(aiLogId, taskInfo)

    try {
      const messageContent: MessageContent[] = [
        { type: 'text', text: 'Create an engaging video for this content group.' },
      ]

      // 调用 Claude Agent（claude-sonnet-4-5）+ MCP 工具执行视频生成
      // Agent 按 system prompt 编排：加载技能 → 选首帧 → 生成视频 → 生成元数据 → 生成封面
      const { result, points } = await this.runAgent(aiLogId, userId, userType, messageContent, abortController)

      // 视频封面兜底：Agent 未生成封面时，从视频自动截帧
      let coverUrl = result.coverUrl
      if (!coverUrl && result.videoUrl) {
        try {
          const fullVideoUrl = FileUtil.buildUrl(result.videoUrl)
          const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(fullVideoUrl, 2)
          const uploadResult = await this.assetsService.uploadFromBuffer(userId, thumbnailBuffer, {
            type: AssetType.VideoThumbnail,
            mimeType: 'image/png',
            filename: 'thumbnail.png',
          })
          coverUrl = uploadResult.asset.path
        }
        catch (error) {
          this.logger.warn({ error }, 'Failed to extract video thumbnail for V1 agent cover')
        }
      }

      // 将生成结果保存为素材记录（类型=VIDEO，来源=PlaceDraft 打卡草稿）
      const material = await this.materialRepository.create({
        userId,
        userType,
        groupId,
        type: MaterialType.VIDEO,
        source: MaterialSource.PlaceDraft,
        status: MaterialStatus.SUCCESS,
        title: result.title,
        desc: result.description,
        topics: result.topics,
        coverUrl,
        mediaList: result.videoUrl
          ? [{ url: result.videoUrl, type: MediaType.VIDEO, thumbUrl: coverUrl }]
          : [],
        useCount: 0,
        autoDeleteMedia: false,
        openAffiliate: true,
        model: 'claude-agent',
        accountTypes: getCompatibleAccountTypes({
          type: 'video',
          title: result.title,
          desc: result.description,
          topics: result.topics,
          duration: 15,
          aspectRatio: '9:16',
        }),
      })

      // 更新 AiLog 状态为成功，记录消耗积分和生成结果
      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Success,
          points,
          response: { materialId: material.id, ...result },
        },
      })

      return { consumedPoints: 0 }
    }
    catch (error) {
      this.logger.error(error, 'v1 generateContent failed')
      throw new DraftGenerationError(
        getErrorMessage(error),
        0,
        error,
      )
    }
    finally {
      // 无论成功失败，都标记任务完成并从运行中列表移除
      completionResolver!()
      this.runningGenerations.delete(aiLogId)
    }
  }

  /**
   * 运行 Claude Agent 执行实际的视频内容生成
   *
   * Agent 配置：
   * - 模型：claude-sonnet-4-5
   * - System Prompt：TikTok 打卡探店视频生成流程（5步走）
   * - MCP 工具：MediaGeneration（视频/图片生成）、Util（工具函数）、VideoUtils（视频处理）
   * - 输出格式：JSON Schema 约束（title, description, topics, videoUrl, coverUrl）
   *
   * @returns result - Agent 生成的结构化结果; points - 消耗积分（USD×100）
   */
  private async runAgent(
    aiLogId: string,
    userId: string,
    userType: UserType,
    messageContent: MessageContent[],
    abortController: AbortController,
  ): Promise<{ result: DraftGenerationResult, points: number }> {
    // 配置 MCP 服务器：提供给 Agent 的外部工具能力
    const mcpServers: Record<string, McpServerConfig> = {
      [McpServerName.MediaGeneration]: this.mediaMcp.createServer(userId, userType),
      [McpServerName.Util]: this.utilMcp.server,
      [McpServerName.VideoUtils]: this.videoUtilsMcp.createServer(userId, userType),
    }

    const taskId = `draft-generation-${aiLogId}`

    this.logger.debug({ taskId, aiLogId, messageContent })

    // 发起 Claude Agent 流式请求
    const req = this.agentService.claudeQuery(
      [{ type: 'text', text: DRAFT_GENERATION_SYSTEM_PROMPT }], // system prompt
      messageContent, // 用户消息（品牌图片+文本）
      abortController,
      {
        includePartialMessages: false,
        outputFormat: {
          type: 'json_schema',
          schema: z.toJSONSchema(DraftGenerationResultSchema, { target: 'draft-07' }),
        },
        model: 'claude-sonnet-4-5-20250514',
        persistSession: false, // 不持久化会话
        taskId,
      },
      mcpServers,
    )

    let result: DraftGenerationResult | undefined
    let points = 0

    // 消费流式响应，等待最终结果
    for await (const chunk of req) {
      this.logger.debug({ taskId, aiLogId, chunk })
      if (chunk.type === 'result') {
        // 提取 Agent 的结构化输出结果
        if (chunk.subtype === 'success') {
          result = chunk.structured_output as DraftGenerationResult
        }
        // 根据 API 调用总费用计算积分消耗（1 USD = 100 积分），仅记录不扣费
        if ('total_cost_usd' in chunk) {
          points = (chunk.total_cost_usd || 0) * 100
        }
      }
    }

    if (!result) {
      throw new Error('Failed to generate draft: no result returned')
    }

    return { result, points }
  }

  // ==================== V2: 固定管线（无 Agent） ====================

  /**
   * V2: 创建草稿生成任务（与 v1 相同的校验逻辑，投递队列时标记 version=v2）
   * 支持选择 modelType（jimeng/grok）、duration、aspectRatio
   */
  async createDraftsV2(userId: string, userType: UserType, dto: CreateDraftGenerationV2Dto): Promise<string[]> {
    const modelConfig = config.ai.models.video.generation.find(m => m.name === dto.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    let resolvedGroupId: string
    if (dto.groupId) {
      const group = await this.materialGroupRepository.getInfo(dto.groupId)
      if (!group || group.userId !== userId) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
      resolvedGroupId = group.id
    }
    else {
      const defaultGroup = await this.materialGroupRepository.getDefaultGroup(userId)
      if (!defaultGroup) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
      resolvedGroupId = defaultGroup.id
    }

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
          aspectRatio: dto.aspectRatio,
          prompt: dto.prompt,
          imageUrls: dto.imageUrls,
          videoUrls: dto.videoUrls,
          draftType: dto.draftType ?? 'draft',
        },
        response: {},
      })

      await this.queueService.addDraftGenerationJob({
        aiLogId: aiLog.id,
        userId,
        userType,
        groupId: resolvedGroupId,
        version: 'v2',
        prompt: dto.prompt,
        imageUrls: dto.imageUrls,
        model: dto.model,
        duration: dto.duration,
        aspectRatio: dto.aspectRatio,
        videoUrls: dto.videoUrls,
        draftType: dto.draftType ?? 'draft',
        platforms: dto.platforms,
      })

      aiLogIds.push(aiLog.id)
    }

    return aiLogIds
  }

  /**
   * V2: 固定管线执行草稿内容生成（由 Consumer 调用）
   *
   * 流程：
   * 1. Gemini Flash 分析品牌 → 选图 + 生成视频 prompt + 元数据（一次 LLM 调用）
   * 2. 根据 modelType 选择 Jimeng 或 Grok 生成视频，失败时兜底到对方
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
      imageUrls?: string[]
      model?: string
      duration?: number
      aspectRatio?: string
      videoUrls?: string[]
      draftType?: DraftType
      platforms?: string[]
    },
  ): Promise<{ consumedPoints: number }> {
    let consumedPoints = 0
    const startTime = Date.now()
    const draftType = options?.draftType ?? 'draft'

    try {
      const candidateImageUrls = options?.imageUrls ?? []
      const model = options?.model ?? 'grok-imagine-video'
      const duration = options?.duration
      const aspectRatio = options?.aspectRatio ?? '9:16'

      // 仅 draft 类型需要 Gemini 规划（生成标题/描述/话题）
      let plan: V2PlanResult | undefined
      if (draftType === 'draft') {
        const { plan: geminiPlan, points: planPoints } = await this.planWithGemini(userId, userType, candidateImageUrls, options?.prompt)
        plan = geminiPlan
        consumedPoints += planPoints
      }

      const { videoUrl, points: videoPoints } = await this.generateVideo(
        aiLogId,
        userId,
        userType,
        model,
        options?.prompt || '',
        candidateImageUrls.length > 0 ? candidateImageUrls : undefined,
        duration,
        aspectRatio,
        options?.videoUrls?.[0],
      )
      consumedPoints += videoPoints

      const fullVideoUrl = FileUtil.buildUrl(videoUrl)
      const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(fullVideoUrl, 2)
      const uploadResult = await this.assetsService.uploadFromBuffer(userId, thumbnailBuffer, {
        type: AssetType.VideoThumbnail,
        mimeType: 'image/png',
        filename: 'thumbnail.png',
      })
      const coverUrl = uploadResult.asset.path

      if (draftType === 'video') {
        // 仅生成视频：存入 Media 表，记录 materialGroupId
        const media = await this.mediaRepository.create({
          userId,
          userType,
          materialGroupId: groupId,
          type: MediaType.VIDEO,
          url: videoUrl,
          thumbUrl: coverUrl,
        })

        await this.aiLogRepository.updateById(aiLogId, {
          $set: {
            status: AiLogStatus.Success,
            model,
            points: consumedPoints,
            duration: Date.now() - startTime,
            response: { mediaId: media.id, videoUrl, coverUrl },
          },
        })

        return { consumedPoints }
      }

      // draft 类型：保存完整草稿素材
      const material = await this.materialRepository.create({
        userId,
        userType,
        groupId,
        type: MaterialType.VIDEO,
        source: MaterialSource.PlaceDraft,
        status: MaterialStatus.SUCCESS,
        title: plan!.title,
        desc: plan!.description,
        topics: plan!.topics,
        coverUrl,
        mediaList: [{ url: videoUrl, type: MediaType.VIDEO, thumbUrl: coverUrl }],
        useCount: 0,
        autoDeleteMedia: false,
        openAffiliate: true,
        model,
        accountTypes: (options?.platforms as AccountType[]) ?? getCompatibleAccountTypes({
          type: 'video',
          title: plan!.title,
          desc: plan!.description,
          topics: plan!.topics,
          duration,
          aspectRatio,
        }),
      })

      const result: DraftGenerationResult = {
        title: plan!.title,
        description: plan!.description,
        topics: plan!.topics,
        videoUrl,
        coverUrl,
      }

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Success,
          model,
          points: consumedPoints,
          duration: Date.now() - startTime,
          response: { materialId: material.id, ...result },
        },
      })

      return { consumedPoints }
    }
    catch (error) {
      this.logger.error(error, 'v2 generateContentV2 failed')
      throw new DraftGenerationError(
        getErrorMessage(error),
        consumedPoints,
        error,
      )
    }
  }

  /**
   * V2 辅助方法：调用 Gemini Flash 一次性完成选图 + 视频 prompt + 元数据生成
   */
  private async planWithGemini(
    userId: string,
    userType: UserType,
    imageUrls: string[],
    userPrompt?: string,
  ): Promise<{ plan: V2PlanResult, points: number }> {
    const modelName = 'gemini-3-flash-preview'
    const startedAt = new Date()

    const userPromptSection = userPrompt
      ? `\n## User Instructions (HIGHEST PRIORITY)\n${userPrompt}\n`
      : ''
    const prompt = `You are a TikTok content generation assistant.
## Task
Analyze the user's prompt and reference images below, then generate TikTok video metadata (title, description, and hashtag topics).
${userPromptSection}

## Reference Images
${imageUrls.map((url, i) => `- Image ${i + 1}: ${url}`).join('\n')}

## Instructions

Generate TikTok metadata for a video based on the user's prompt and images:
- **title**: Catchy title under 30 characters, in the language matching the user's prompt or images
- **description**: Engaging description with call-to-action, under 2200 characters, in the language matching the user's prompt or images.
- **topics**: 3-5 relevant hashtags (without # prefix)
- **IMPORTANT**: Do NOT generate any content featuring children, minors, or anyone appearing under 18. If the user's prompt mentions minors, replace them with adults in the output.
Return the result as JSON.`

    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: config.ai.gemini.apiKey,
      baseUrl: config.ai.gemini.baseUrl,
      temperature: 1.2, // 提高创意多样性
    })

    const messageContent: Array<{ type: 'image_url', image_url: string } | { type: 'text', text: string }> = []

    for (const url of imageUrls) {
      const fullUrl = FileUtil.buildUrl(url)
      const { base64, mimeType } = await this.fetchImageAsBase64(fullUrl)
      messageContent.push({
        type: 'image_url',
        image_url: `data:${mimeType};base64,${base64}`,
      })
    }
    messageContent.push({ type: 'text', text: prompt })

    const structuredModel = model.withStructuredOutput(z.toJSONSchema(V2PlanResultSchema), { includeRaw: true })
    const { raw, parsed: structuredResult } = await structuredModel.invoke([
      new HumanMessage({ content: messageContent }),
    ])

    if (!structuredResult) {
      throw new Error('V2: No response from Gemini planning step')
    }

    const parsed = z.safeParse(V2PlanResultSchema, structuredResult)
    if (!parsed.success) {
      throw new Error(`V2: Invalid plan result: ${z.prettifyError(parsed.error)}`)
    }

    // 记录用量和扣费
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
        request: { imageCount: imageUrls.length },
        response: parsed.data,
        status: AiLogStatus.Success,
      })
    }

    this.logger.log({ plan: parsed.data }, 'V2: Plan generated')
    return { plan: parsed.data, points: 0 }
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
    aspectRatio?: string,
    videoUrl?: string,
  ): Promise<{ videoUrl: string, points: number }> {
    const task = await this.videoService.userVideoGeneration({
      userId,
      userType,
      model,
      prompt: videoPrompt,
      image: imageUrls,
      video_url: videoUrl,
      duration,
      metadata: { aspectRatio },
    })

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
    let resolvedGroupId: string
    if (dto.groupId) {
      const group = await this.materialGroupRepository.getInfo(dto.groupId)
      if (!group || group.userId !== userId) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
      resolvedGroupId = group.id
    }
    else {
      const defaultGroup = await this.materialGroupRepository.getDefaultGroup(userId)
      if (!defaultGroup) {
        throw new AppException(ResponseCode.MaterialGroupNotFound)
      }
      resolvedGroupId = defaultGroup.id
    }

    const channel = AiLogChannel.Gemini

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
          imageUrls: dto.imageUrls,
          draftType: dto.draftType ?? 'draft',
        },
        response: {},
      })

      await this.queueService.addDraftGenerationJob({
        aiLogId: aiLog.id,
        userId,
        userType,
        groupId: resolvedGroupId,
        version: 'v2-image-text',
        prompt: dto.prompt,
        imageUrls: dto.imageUrls,
        imageModel: dto.imageModel,
        imageCount: dto.imageCount ?? 3,
        imageSize: dto.imageSize,
        aspectRatio: dto.aspectRatio,
        imageTextDraftType: dto.draftType ?? 'draft',
        platforms: dto.platforms,
      })

      aiLogIds.push(aiLog.id)
    }

    return aiLogIds
  }

  /**
   * 图文草稿内容生成（异步阶段，由 Consumer 调用）
   *
   * 流程：
   * 1. Gemini Flash 规划 → title / description / topics / imagePrompts
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
      imageUrls?: string[]
      imageModel: string
      imageCount: number
      imageSize?: string
      aspectRatio?: string
      draftType?: ImageTextDraftType
      platforms?: string[]
    },
  ): Promise<{ consumedPoints: number }> {
    let consumedPoints = 0
    const startTime = Date.now()
    const draftType = options.draftType ?? 'draft'

    try {
      const referenceImageUrls = options.imageUrls ?? []
      this.logger.log(
        { aiLogId, imageModel: options.imageModel, imageCount: options.imageCount, aspectRatio: options.aspectRatio, refImageCount: referenceImageUrls.length, draftType },
        'ImageText: Starting generation',
      )

      // 仅 draft 类型需要 Gemini 规划（生成标题/描述/话题/图片 prompts）
      let plan: ImageTextPlanResult | undefined
      let imagePrompts: string[]

      if (draftType === 'draft') {
        const { plan: geminiPlan, points: planPoints } = await this.planImageTextWithGemini(
          userId,
          userType,
          referenceImageUrls,
          options.prompt,
          options.imageCount,
        )
        plan = geminiPlan
        imagePrompts = plan.imagePrompts
        consumedPoints += planPoints
        this.logger.log(
          { aiLogId, title: plan.title, imagePromptsCount: plan.imagePrompts.length, planPoints },
          'ImageText: Planning completed',
        )
      }
      else {
        // image 类型：直接使用用户 prompt 作为每张图片的生成 prompt
        imagePrompts = Array.from({ length: options.imageCount }, () => options.prompt)
      }

      const { urls: generatedImageUrls, points: imagePoints } = await this.generateImages(
        userId,
        userType,
        options.imageModel,
        imagePrompts,
        referenceImageUrls,
        options.aspectRatio,
        options.imageSize,
      )
      consumedPoints += imagePoints
      this.logger.log(
        { aiLogId, generatedCount: generatedImageUrls.length, imagePoints },
        'ImageText: Image generation completed',
      )

      if (generatedImageUrls.length === 0) {
        throw new Error('ImageText: No images were generated')
      }

      if (draftType === 'image') {
        // 仅生成图片：逐张存入 Media 表，记录 materialGroupId
        const mediaIds: string[] = []
        for (const imageUrl of generatedImageUrls) {
          const media = await this.mediaRepository.create({
            userId,
            userType,
            materialGroupId: groupId,
            type: MediaType.IMG,
            url: imageUrl,
          })
          mediaIds.push(media.id)
        }

        await this.aiLogRepository.updateById(aiLogId, {
          $set: {
            status: AiLogStatus.Success,
            model: options.imageModel,
            points: consumedPoints,
            duration: Date.now() - startTime,
            response: { mediaIds, imageUrls: generatedImageUrls },
          },
        })

        return { consumedPoints }
      }

      // draft 类型：保存完整图文草稿素材
      const coverUrl = generatedImageUrls[0]

      const material = await this.materialRepository.create({
        userId,
        userType,
        groupId,
        type: MaterialType.ARTICLE,
        source: MaterialSource.PlaceDraft,
        status: MaterialStatus.SUCCESS,
        title: plan!.title,
        desc: plan!.description,
        topics: plan!.topics,
        coverUrl,
        mediaList: generatedImageUrls.map(url => ({ url, type: MediaType.IMG })),
        useCount: 0,
        autoDeleteMedia: false,
        openAffiliate: true,
        model: options.imageModel,
        accountTypes: (options.platforms as AccountType[]) ?? getCompatibleAccountTypes({
          type: 'article',
          title: plan!.title,
          desc: plan!.description,
          topics: plan!.topics,
          imageCount: generatedImageUrls.length,
          aspectRatio: options.aspectRatio,
        }),
      })

      const result: DraftGenerationResult = {
        title: plan!.title,
        description: plan!.description,
        topics: plan!.topics,
        coverUrl,
        imageUrls: generatedImageUrls,
      }

      await this.aiLogRepository.updateById(aiLogId, {
        $set: {
          status: AiLogStatus.Success,
          model: options.imageModel,
          points: consumedPoints,
          duration: Date.now() - startTime,
          response: { materialId: material.id, ...result },
        },
      })

      return { consumedPoints }
    }
    catch (error) {
      this.logger.error(error, 'v2 generateContentImageText failed')
      throw new DraftGenerationError(
        getErrorMessage(error),
        consumedPoints,
        error,
      )
    }
  }

  /**
   * 图文规划：调用 Gemini Flash 生成元数据 + 每张图片的 prompt
   */
  private async planImageTextWithGemini(
    userId: string,
    userType: UserType,
    imageUrls: string[],
    userPrompt: string,
    imageCount: number,
  ): Promise<{ plan: ImageTextPlanResult, points: number }> {
    const modelName = 'gemini-3-flash-preview'
    const startedAt = new Date()

    const prompt = `You are a social media content generation assistant.
## Task
Analyze the user's prompt and reference images below, then generate post metadata and image generation prompts.

## User Instructions (HIGHEST PRIORITY)
${userPrompt}

## Reference Images
${imageUrls.map((url, i) => `- Image ${i + 1}: ${url}`).join('\n') || 'No reference images provided.'}

## Instructions

Generate metadata and ${imageCount} image prompts for a social media image-text post:
- **title**: Catchy title under 30 characters, in the language matching the user's prompt
- **description**: Engaging description with call-to-action, under 2200 characters, in the language matching the user's prompt
- **topics**: 3-5 relevant hashtags (without # prefix)
- **imagePrompts**: Exactly ${imageCount} detailed image generation prompts in English. Each prompt should:
  - Be self-contained and descriptive (the image generator has no context of other images)
  - Describe visual style, composition, colors, and mood
  - Be suitable for AI image generation (100-500 characters each)
  - Together form a coherent visual story for the post
  - **IMPORTANT**: NEVER depict children, minors, or anyone appearing under 18. If the user's prompt mentions minors, replace them with adults in the image prompts.

Return the result as JSON.`

    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: config.ai.gemini.apiKey,
      baseUrl: config.ai.gemini.baseUrl,
      temperature: 1.2,
    })

    const messageContent: Array<{ type: 'image_url', image_url: string } | { type: 'text', text: string }> = []

    for (const url of imageUrls) {
      const fullUrl = FileUtil.buildUrl(url)
      const { base64, mimeType } = await this.fetchImageAsBase64(fullUrl)
      messageContent.push({
        type: 'image_url',
        image_url: `data:${mimeType};base64,${base64}`,
      })
    }
    messageContent.push({ type: 'text', text: prompt })

    const structuredModel = model.withStructuredOutput(z.toJSONSchema(ImageTextPlanResultSchema), { includeRaw: true })
    const { raw, parsed: structuredResult } = await structuredModel.invoke([
      new HumanMessage({ content: messageContent }),
    ])

    if (!structuredResult) {
      throw new Error('ImageText: No response from Gemini planning step')
    }

    const parsed = z.safeParse(ImageTextPlanResultSchema, structuredResult)
    if (!parsed.success) {
      throw new Error(`ImageText: Invalid plan result: ${z.prettifyError(parsed.error)}`)
    }

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
        request: { imageCount: imageUrls.length },
        response: parsed.data,
        status: AiLogStatus.Success,
      })
    }

    this.logger.log({ plan: parsed.data }, 'ImageText: Plan generated')
    return { plan: parsed.data, points: 0 }
  }

  /**
   * 根据模型类型批量生成图片
   */
  private async generateImages(
    userId: string,
    userType: UserType,
    imageModel: string,
    imagePrompts: string[],
    referenceImageUrls: string[],
    aspectRatio?: string,
    imageSize?: string,
  ): Promise<{ urls: string[], points: number }> {
    return this.generateImagesWithGemini(userId, userType, imageModel, imagePrompts, referenceImageUrls, aspectRatio, imageSize)
  }

  /**
   * 使用 Gemini 模型（nb2/nb-pro）批量生成图片
   * 注意：userGeminiGeneration 内部已自动扣费和记录 AiLog
   */
  private async generateImagesWithGemini(
    userId: string,
    userType: UserType,
    model: string,
    imagePrompts: string[],
    referenceImageUrls: string[],
    aspectRatio?: string,
    imageSize?: string,
  ): Promise<{ urls: string[], points: number }> {
    const urls: string[] = []
    let totalPoints = 0

    for (const [index, prompt] of imagePrompts.entries()) {
      this.logger.log(
        { model, promptIndex: index, promptLength: prompt.length, aspectRatio, imageSize },
        'ImageText: Generating image with Gemini',
      )

      const result = await retry(
        () => this.imageService.userGeminiGeneration({
          userId,
          userType,
          model: model as 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview',
          prompt,
          imageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
          ...(imageSize ? { imageSize: imageSize as '1K' | '2K' | '4K' } : {}),
          ...(aspectRatio ? { aspectRatio: aspectRatio as '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' } : {}),
        }),
        {
          maxRetries: 3,
          delayMs: 1000,
          onRetry: (error, attempt) => {
            this.logger.warn(
              { promptIndex: index, attempt, error: error.message },
              'ImageText: Gemini image generation failed, retrying',
            )
          },
        },
      )

      if (result.images.length > 0) {
        for (const image of result.images) {
          urls.push(image.url)
        }
      }
      totalPoints += result.usage?.points ?? 0
    }

    return { urls, points: totalPoints }
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string, mimeType: string }> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      base64: buffer.toString('base64'),
      mimeType: contentType,
    }
  }
}
