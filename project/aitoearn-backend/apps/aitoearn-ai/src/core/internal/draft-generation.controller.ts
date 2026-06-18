import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { DraftGenerationService } from '../draft-generation/draft-generation.service'
import {
  CreateDraftGenerationVo,
  DraftGenerationTaskVo,
} from '../draft-generation/draft-generation.vo'
import {
  InternalCreateDraftV2Dto,
  InternalCreateImageTextDraftDto,
  InternalGetDraftTaskDto,
} from './draft-generation.dto'

@ApiTags('Internal/DraftGeneration')
@Controller('internal')
@Internal()
export class DraftGenerationInternalController {
  constructor(
    private readonly draftGenerationService: DraftGenerationService,
  ) {}

  @ApiDoc({
    summary: '生成品牌内容草稿 (V2)',
    body: InternalCreateDraftV2Dto.schema,
    response: CreateDraftGenerationVo,
  })
  @Post('ai/draft-generation/v2')
  async createDraftsV2(@Body() body: InternalCreateDraftV2Dto): Promise<CreateDraftGenerationVo> {
    const taskIds = await this.draftGenerationService.createDraftsV2(body.userId, body.userType, body)
    return CreateDraftGenerationVo.create({ taskIds })
  }

  @ApiDoc({
    summary: '生成图文内容草稿',
    body: InternalCreateImageTextDraftDto.schema,
    response: CreateDraftGenerationVo,
  })
  @Post('ai/draft-generation/image-text')
  async createImageTextDrafts(@Body() body: InternalCreateImageTextDraftDto): Promise<CreateDraftGenerationVo> {
    const taskIds = await this.draftGenerationService.createImageTextDrafts(body.userId, body.userType, body)
    return CreateDraftGenerationVo.create({ taskIds })
  }

  @ApiDoc({
    summary: '查询单个草稿生成任务',
    body: InternalGetDraftTaskDto.schema,
    response: DraftGenerationTaskVo,
  })
  @Post('ai/draft-generation/task')
  async getTask(@Body() body: InternalGetDraftTaskDto): Promise<DraftGenerationTaskVo> {
    const task = await this.draftGenerationService.getTask(body.taskId, body.userId, body.userType)
    return DraftGenerationTaskVo.create(task)
  }
}
