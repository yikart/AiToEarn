import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, ParseObjectIdPipe, UserType } from '@yikart/common'
import { MetricEventHelperService, MetricEventName } from '@yikart/helpers'
import { DraftGenerationMemoryService } from './draft-generation-memory.service'
import {
  CreateDraftFromVideoUrlDto,
  CreateDraftFromVideoUrlDtoSchema,
  CreateDraftGenerationV2Dto,
  CreateDraftGenerationV2DtoSchema,
  CreateImageTextDraftDto,
  CreateImageTextDraftDtoSchema,
  ListDraftGenerationMemoryDto,
  ListDraftGenerationMemoryDtoSchema,
  ListDraftGenerationTasksDto,
  ListDraftGenerationTasksDtoSchema,
  QueryDraftGenerationTasksDto,
  QueryDraftGenerationTasksDtoSchema,
  RegenerateDraftGenerationMemoryDto,
  RegenerateDraftGenerationMemoryDtoSchema,
} from './draft-generation.dto'
import { DraftGenerationService } from './draft-generation.service'
import {
  CreateDraftFromVideoUrlVo,
  CreateDraftGenerationVo,
  DraftGenerationMemoryVo,
  DraftGenerationPricingVo,
  DraftGenerationStatsVo,
  DraftGenerationTaskListVo,
  DraftGenerationTaskVo,
} from './draft-generation.vo'

@ApiTags('AI/Draft-Generation')
@Controller('/ai/draft-generation')
export class DraftGenerationController {
  constructor(
    private readonly draftGenerationService: DraftGenerationService,
    private readonly draftGenerationMemoryService: DraftGenerationMemoryService,
    private readonly metricEventHelperService: MetricEventHelperService,
  ) { }

  @ApiDoc({
    summary: '获取草稿生成统计',
    description: '获取当前用户草稿生成任务的统计信息（生成中数量）',
    response: DraftGenerationStatsVo,
  })
  @Get('/stats')
  async getStats(
    @GetToken() token: TokenInfo,
  ): Promise<DraftGenerationStatsVo> {
    const stats = await this.draftGenerationService.getStats(token.id, UserType.User)
    return DraftGenerationStatsVo.create(stats)
  }

  @ApiDoc({
    summary: '草稿生成任务分页列表',
    description: '分页查询当前用户的草稿生成任务列表',
    query: ListDraftGenerationTasksDtoSchema,
    response: DraftGenerationTaskListVo,
  })
  @Get('/')
  async listTasksWithPagination(
    @GetToken() token: TokenInfo,
    @Query() query: ListDraftGenerationTasksDto,
  ): Promise<DraftGenerationTaskListVo> {
    const [list, total] = await this.draftGenerationService.listTasksWithPagination(query, token.id, UserType.User)
    return new DraftGenerationTaskListVo(list, total, query)
  }

  @ApiDoc({
    summary: '批量查询草稿生成任务',
    description: '根据任务 ID 列表批量查询草稿生成任务状态',
    body: QueryDraftGenerationTasksDtoSchema,
    response: [DraftGenerationTaskVo],
  })
  @Post('/query')
  async listTasks(
    @GetToken() token: TokenInfo,
    @Body() body: QueryDraftGenerationTasksDto,
  ): Promise<DraftGenerationTaskVo[]> {
    const tasks = await this.draftGenerationService.listTasks(body, token.id, UserType.User)
    return tasks.map(task => DraftGenerationTaskVo.create(task))
  }

  @Public()
  @ApiDoc({
    summary: '获取草稿生成模型价格',
    description: '获取图片生成和视频生成模型的价格信息',
    response: DraftGenerationPricingVo,
  })
  @Get('/pricing')
  getPricing(): DraftGenerationPricingVo {
    const pricing = this.draftGenerationService.getDraftGenerationPricing()
    return DraftGenerationPricingVo.create(pricing)
  }

  @ApiDoc({
    summary: '查询草稿生成 Memory',
    query: ListDraftGenerationMemoryDtoSchema,
    response: [DraftGenerationMemoryVo],
  })
  @Get('/memory')
  async listMemory(
    @GetToken() token: TokenInfo,
    @Query() query: ListDraftGenerationMemoryDto,
  ): Promise<DraftGenerationMemoryVo[]> {
    const memories = await this.draftGenerationMemoryService.listMemories(token.id, query.contentType)
    return memories.map(memory => DraftGenerationMemoryVo.create(memory))
  }

  @ApiDoc({
    summary: '删除草稿生成 Memory 条目',
    response: DraftGenerationMemoryVo,
  })
  @Delete('/memory/items/:itemId')
  async deleteMemoryItem(
    @GetToken() token: TokenInfo,
    @Param('itemId') itemId: string,
  ): Promise<DraftGenerationMemoryVo> {
    const memory = await this.draftGenerationMemoryService.deleteItem(token.id, itemId)
    return DraftGenerationMemoryVo.create(memory)
  }

  @ApiDoc({
    summary: '重新生成草稿生成 Memory',
    body: RegenerateDraftGenerationMemoryDtoSchema,
    response: DraftGenerationMemoryVo,
  })
  @Post('/memory/regenerate')
  async regenerateMemory(
    @GetToken() token: TokenInfo,
    @Body() body: RegenerateDraftGenerationMemoryDto,
  ): Promise<DraftGenerationMemoryVo> {
    const memory = await this.draftGenerationMemoryService.regenerateMemory(token.id, body.contentType, body.plannerModel)
    return DraftGenerationMemoryVo.create(memory)
  }

  @ApiDoc({
    summary: '查询单个草稿生成任务',
    description: '根据任务 ID 查询草稿生成任务详情',
    response: DraftGenerationTaskVo,
  })
  @Get('/:id')
  async getTask(
    @GetToken() token: TokenInfo,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<DraftGenerationTaskVo> {
    const task = await this.draftGenerationService.getTask(id, token.id, UserType.User)
    return DraftGenerationTaskVo.create(task)
  }

  /**
   * V2: 直接调用 core/ai 服务的固定管线，省去 Agent 编排开销
   *
   * 流程：
   * 1. [同步] 校验模型、解析素材组、创建 AiLog、投递队列（version=v2）
   * 2. [异步] Consumer 路由到 generateContentV2：
   *    Gemini Flash 生成 prompt+元数据 → 生成视频 → 截帧封面 → 保存素材
   */
  @ApiDoc({
    summary: '生成品牌内容草稿 (V2)',
    description: '使用固定管线直接调用 AI 服务生成 TikTok 视频内容草稿。前端直接传入 model（如 grok-imagine-video）、duration、aspectRatio。返回 taskIds 可用于查询进度。',
    body: CreateDraftGenerationV2DtoSchema,
    response: CreateDraftGenerationVo,
  })
  @Post('/v2')
  async createDraftsV2(
    @GetToken() token: TokenInfo,
    @Body() body: CreateDraftGenerationV2Dto,
  ): Promise<CreateDraftGenerationVo> {
    const taskIds = await this.draftGenerationService.createDraftsV2(token.id, UserType.User, body)
    await this.metricEventHelperService.record(token.id, MetricEventName.contentManagementAiGenerate)
    return CreateDraftGenerationVo.create({ taskIds })
  }

  @ApiDoc({
    summary: '生成图文内容草稿',
    description: '使用 AI 生成图文内容草稿。支持选择草稿价格接口返回且当前服务已接入的图片模型；非 Gemini 模型收到参考图时，会优先尝试编辑能力，否则忽略参考图继续生成。返回 taskIds 可用于查询进度。',
    body: CreateImageTextDraftDtoSchema,
    response: CreateDraftGenerationVo,
  })
  @Post('/image-text')
  async createImageTextDrafts(
    @GetToken() token: TokenInfo,
    @Body() body: CreateImageTextDraftDto,
  ): Promise<CreateDraftGenerationVo> {
    const taskIds = await this.draftGenerationService.createImageTextDrafts(token.id, UserType.User, body)
    await this.metricEventHelperService.record(token.id, MetricEventName.contentManagementAiGenerate)
    return CreateDraftGenerationVo.create({ taskIds })
  }

  @ApiDoc({
    summary: '视频 URL 生成草稿文案',
    description: '传入纯视频 URL，使用 Gemini 多模态模型分析视频内容，自动生成标题、描述、话题并保存为草稿。同步返回草稿 ID。',
    body: CreateDraftFromVideoUrlDtoSchema,
    response: CreateDraftFromVideoUrlVo,
  })
  @Post('/from-video-url')
  async createDraftFromVideoUrl(
    @GetToken() token: TokenInfo,
    @Body() body: CreateDraftFromVideoUrlDto,
  ): Promise<CreateDraftFromVideoUrlVo> {
    const result = await this.draftGenerationService.generateDraftFromVideoUrl(token.id, UserType.User, body)
    await this.metricEventHelperService.record(token.id, MetricEventName.contentManagementAiGenerate)
    return CreateDraftFromVideoUrlVo.create(result)
  }
}
