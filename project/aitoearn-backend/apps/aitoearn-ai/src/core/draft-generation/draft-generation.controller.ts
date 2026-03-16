import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import {
  CreateDraftGenerationDto,
  CreateDraftGenerationDtoSchema,
  CreateDraftGenerationV2Dto,
  CreateDraftGenerationV2DtoSchema,
  CreateImageTextDraftDto,
  CreateImageTextDraftDtoSchema,
  ListDraftGenerationTasksDto,
  ListDraftGenerationTasksDtoSchema,
  QueryDraftGenerationTasksDto,
  QueryDraftGenerationTasksDtoSchema,
} from './draft-generation.dto'
import { DraftGenerationService } from './draft-generation.service'
import {
  CreateDraftGenerationVo,
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
    summary: '查询单个草稿生成任务',
    description: '根据任务 ID 查询草稿生成任务详情',
    response: DraftGenerationTaskVo,
  })
  @Get('/:id')
  async getTask(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ): Promise<DraftGenerationTaskVo> {
    const task = await this.draftGenerationService.getTask(id, token.id, UserType.User)
    return DraftGenerationTaskVo.create(task)
  }

  /**
   * 创建草稿生成任务
   *
   * 完整流程：
   * 1. [同步] Service.createDrafts 校验用户品牌库、解析目标素材组
   * 2. [同步] 按 quantity 数量循环创建 AiLog（状态=Generating）并投递 BullMQ 任务
   * 3. [同步] 立即返回 taskIds（AiLog ID 列表），前端可轮询查询进度
   * 4. [异步] DraftGenerationConsumer 消费队列（并发=3，重试=3次，指数退避30s）
   * 5. [异步] Service.generateContent 调用 Claude Agent + MCP 工具生成 TikTok 视频
   * 6. [异步] 生成成功后创建 Material 素材记录、扣除积分、更新 AiLog 状态
   */
  @ApiDoc({
    summary: '生成品牌内容草稿',
    description: '根据用户品牌库信息生成 TikTok 视频内容草稿，保存到指定素材组。返回 taskIds 可用于查询 AiLog 获取进度。',
    body: CreateDraftGenerationDtoSchema,
    response: CreateDraftGenerationVo,
  })
  @Post('/')
  async createDrafts(
    @GetToken() token: TokenInfo,
    @Body() body: CreateDraftGenerationDto,
  ): Promise<CreateDraftGenerationVo> {
    // 委托 Service 创建任务并投递队列，返回 AiLog ID 列表
    const taskIds = await this.draftGenerationService.createDrafts(token.id, UserType.User, body)
    return CreateDraftGenerationVo.create({ taskIds })
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
    return CreateDraftGenerationVo.create({ taskIds })
  }

  @ApiDoc({
    summary: '生成图文内容草稿',
    description: '使用 AI 生成图文内容草稿。支持选择图片模型：nb2（Nano Banana 2）或 nb-pro（Nano Banana Pro）。返回 taskIds 可用于查询进度。',
    body: CreateImageTextDraftDtoSchema,
    response: CreateDraftGenerationVo,
  })
  @Post('/image-text')
  async createImageTextDrafts(
    @GetToken() token: TokenInfo,
    @Body() body: CreateImageTextDraftDto,
  ): Promise<CreateDraftGenerationVo> {
    const taskIds = await this.draftGenerationService.createImageTextDrafts(token.id, UserType.User, body)
    return CreateDraftGenerationVo.create({ taskIds })
  }
}
