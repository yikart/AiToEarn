import { Injectable } from '@nestjs/common'
import { AitoearnAiClientService } from '@yikart/aitoearn-ai-client'
import { CreateDraftGenerationV2DtoSchema, CreateImageTextDraftDtoSchema } from '@yikart/aitoearn-ai-shared'
import { getUser, toTextResult, toYamlTextResult, UserType } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import { z } from 'zod'

@Injectable()
export class DraftGenerationMcpController {
  constructor(
    private readonly aiClientService: AitoearnAiClientService,
  ) {}

  @Tool({
    name: 'createVideoDraft',
    description: 'Generate video content drafts using AI. Use getDraftGenerationPricing first to get available models. prompt is only for video generation; captionPrompt is for title, description, and topics. When draftType is video, only media is generated and prompt is the pure video prompt. Returns task IDs, use getDraftTaskStatus to check progress.',
    parameters: CreateDraftGenerationV2DtoSchema,
  })
  async createVideoDraft(params: z.infer<typeof CreateDraftGenerationV2DtoSchema>) {
    const user = getUser()
    const result = await this.aiClientService.ai.createDraftV2({
      userId: user.id,
      userType: UserType.User,
      ...params,
    })
    return toTextResult(`Video draft generation started. Task IDs: ${result.taskIds.join(', ')}\nUse getDraftTaskStatus to check progress.`)
  }

  @Tool({
    name: 'createImageTextDraft',
    description: 'Generate image-text content drafts using AI. Use getDraftGenerationPricing first to get available image models. When draftType is image, only media is generated and prompt is the pure image prompt. Returns task IDs, use getDraftTaskStatus to check progress.',
    parameters: CreateImageTextDraftDtoSchema,
  })
  async createImageTextDraft(params: z.infer<typeof CreateImageTextDraftDtoSchema>) {
    const user = getUser()
    const result = await this.aiClientService.ai.createImageTextDraft({
      userId: user.id,
      userType: UserType.User,
      ...params,
    })
    return toTextResult(`Image-text draft generation started. Task IDs: ${result.taskIds.join(', ')}\nUse getDraftTaskStatus to check progress.`)
  }

  @Tool({
    name: 'getDraftTaskStatus',
    description: 'Get the status and result of a draft generation task. Status: generating, success, or failed. Returns generated content details on success.',
    parameters: z.object({ taskId: z.string().describe('Draft generation task ID') }),
  })
  async getDraftTaskStatus(params: { taskId: string }) {
    const user = getUser()
    const task = await this.aiClientService.ai.getDraftTask({
      userId: user.id,
      userType: UserType.User,
      taskId: params.taskId,
    })
    return toYamlTextResult(task)
  }

  @Tool({
    name: 'getDraftGenerationPricing',
    description: 'Get AI draft generation model pricing, including available video and image generation models with their supported parameters and prices.',
    parameters: z.object({}),
  })
  async getDraftGenerationPricing() {
    const pricing = await this.aiClientService.ai.getDraftPricing()
    return toYamlTextResult(pricing)
  }
}
