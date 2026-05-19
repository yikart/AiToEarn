import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { DraftGenerationMemoryContentType } from '@yikart/aitoearn-ai-shared'
import { AppException, ResponseCode } from '@yikart/common'
import {
  AiLog,
  AiLogRepository,
  AiLogStatus,
  AiLogType,
  DraftGenerationMemoryItem,
  DraftGenerationMemoryRepository,
  Material,
  MaterialRepository,
  MaterialSource,
  MaterialStatus,
  MaterialType,
} from '@yikart/mongodb'
import { DraftGenerationPlannerService } from './draft-generation-planner.service'

interface PlannerMemoryContext {
  memoryItems: string[]
}

@Injectable()
export class DraftGenerationMemoryService {
  private readonly logger = new Logger(DraftGenerationMemoryService.name)

  constructor(
    private readonly draftGenerationMemoryRepository: DraftGenerationMemoryRepository,
    private readonly aiLogRepository: AiLogRepository,
    private readonly materialRepository: MaterialRepository,
    private readonly plannerService: DraftGenerationPlannerService,
  ) {}

  async listMemories(userId: string, contentType?: DraftGenerationMemoryContentType) {
    return await this.draftGenerationMemoryRepository.listByUserId(userId, contentType)
  }

  async getPlannerMemoryContext(userId: string, contentType: DraftGenerationMemoryContentType): Promise<PlannerMemoryContext> {
    const memory = await this.draftGenerationMemoryRepository.getByUserIdAndContentType(userId, contentType)
    if (!memory) {
      return { memoryItems: [] }
    }

    return {
      memoryItems: (memory.items ?? []).map(item => item.text),
    }
  }

  async deleteItem(userId: string, itemId: string) {
    const memory = await this.draftGenerationMemoryRepository.deleteItemByUserIdAndItemId(userId, itemId)
    if (!memory) {
      throw new AppException(ResponseCode.DraftGenerationMemoryNotFound)
    }
    return memory
  }

  async regenerateMemory(userId: string, contentType: DraftGenerationMemoryContentType, plannerModel?: string) {
    const { aiLogs, materials } = await this.listMemorySamples(userId, contentType)
    const sampleCount = aiLogs.length + materials.length
    const now = new Date()

    if (sampleCount === 0) {
      const emptyMemory = await this.draftGenerationMemoryRepository.updateByUserIdAndContentType(userId, contentType, {
        $set: { userId, contentType, items: [], sampleCount: 0, lastGeneratedAt: now },
      })
      if (!emptyMemory) {
        throw new AppException(ResponseCode.DraftGenerationMemoryNotFound)
      }
      return emptyMemory
    }

    const prompt = this.buildMemoryPrompt(contentType, aiLogs, materials)
    const result = await this.plannerService.generateMemoryItems(plannerModel, prompt)
    const autoTexts = Array.from(new Set(result.items.map(item => item.text)))
    const items: DraftGenerationMemoryItem[] = autoTexts.slice(0, 20).map(text => ({
      id: randomUUID(),
      text,
      createdAt: now,
      updatedAt: now,
    }))

    const generatedMemory = await this.draftGenerationMemoryRepository.updateByUserIdAndContentType(userId, contentType, {
      $set: { userId, contentType, items, sampleCount, lastGeneratedAt: now },
    })
    if (!generatedMemory) {
      throw new AppException(ResponseCode.DraftGenerationMemoryNotFound)
    }
    return generatedMemory
  }

  async refreshRecentUsers(since: Date) {
    const [aiLogUsers, materialUsers] = await Promise.all([
      this.aiLogRepository.listUserIdsByTypeAndStatusAndUpdatedAt(AiLogType.DraftGeneration, AiLogStatus.Success, since),
      this.materialRepository.listUserIdsBySourceAndStatusAndUpdatedAt(MaterialSource.PlaceDraft, MaterialStatus.SUCCESS, since),
    ])
    const userIds = Array.from(new Set([...aiLogUsers, ...materialUsers]))
    for (const userId of userIds) {
      for (const contentType of [DraftGenerationMemoryContentType.Video, DraftGenerationMemoryContentType.ImageText]) {
        try {
          await this.regenerateMemory(userId, contentType)
        }
        catch (error) {
          this.logger.error(error, `Failed to refresh draft generation memory userId=${userId}, contentType=${contentType}`)
        }
      }
    }
  }

  private async listMemorySamples(userId: string, contentType: DraftGenerationMemoryContentType) {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const materialType = contentType === DraftGenerationMemoryContentType.Video ? MaterialType.VIDEO : MaterialType.ARTICLE
    const [aiLogs, materials] = await Promise.all([
      this.aiLogRepository.listByUserIdAndTypeAndStatusAndRequestVersionAndCreatedAt(
        userId,
        AiLogType.DraftGeneration,
        AiLogStatus.Success,
        contentType === DraftGenerationMemoryContentType.Video ? 'v2' : 'v2-image-text',
        since,
        25,
      ),
      this.materialRepository.listByUserIdAndTypeAndSourceAndStatusAndCreatedAt(
        userId,
        materialType,
        MaterialSource.PlaceDraft,
        MaterialStatus.SUCCESS,
        since,
        25,
      ),
    ])
    return { aiLogs, materials }
  }

  private buildMemoryPrompt(contentType: DraftGenerationMemoryContentType, aiLogs: AiLog[], materials: Material[]) {
    const samples = {
      aiLogs: aiLogs.map(log => ({ request: log.request, response: log.response })),
      materials: materials.map(material => ({
        title: material.title,
        desc: material.desc,
        topics: material.topics,
        generationParams: material.generationParams,
        type: material.type,
      })),
    }
    return `Summarize stable user preferences for ${contentType} draft generation.
Rules:
- Each item must be one short stable preference.
- Use the language that best matches the history samples or the user's usual language.
- Keep only preferences repeated across history.
- Do not include one-off campaign details, exact product names, or temporary topics.

History samples:
${JSON.stringify(samples, null, 2)}`
  }
}
