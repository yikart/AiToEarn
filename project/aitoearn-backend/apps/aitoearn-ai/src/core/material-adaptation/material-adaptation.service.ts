import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, CreditsType, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, Material, MaterialAdaptationRepository, MaterialRepository } from '@yikart/mongodb'
import { createAgent } from 'langchain'
import { config } from '../../config'
import { calculatePricingPoints, ChatPricing, TokenUsageDetails } from '../ai/pricing/pricing-calculator'
import { buildConfigOnlySchema, buildDynamicOutputSchema, checkPlatformLimits, PLATFORM_RESTRICTIONS, PLATFORMS_REQUIRING_CONFIG } from './material-adaptation.constants'
import { AdaptMaterialDto, PlatformOptions, UpdateMaterialAdaptationDto } from './material-adaptation.dto'
import { MaterialAdaptationVo } from './material-adaptation.vo'

@Injectable()
export class MaterialAdaptationService {
  private readonly logger = new Logger(MaterialAdaptationService.name)

  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly materialAdaptationRepository: MaterialAdaptationRepository,
    private readonly creditsHelper: CreditsHelperService,
    private readonly aiLogRepo: AiLogRepository,
  ) { }

  private async createMcpClient(headers: Record<string, string>) {
    const client = new MultiServerMCPClient({
      publish: {
        transport: 'http',
        url: `${config.serverClient.baseUrl}/publish/mcp`,
        headers,
      },
    })
    return client
  }

  async adaptMaterial(dto: AdaptMaterialDto, headers?: Record<string, string>): Promise<MaterialAdaptationVo[]> {
    const material = await this.materialRepository.getInfo(dto.materialId)
    if (!material) {
      throw new AppException(ResponseCode.MaterialNotFound)
    }

    const materialOptions = material.option as PlatformOptions | undefined

    const existingAdaptations = await this.materialAdaptationRepository.listByMaterialId(dto.materialId)
    const existingPlatformMap = new Map(existingAdaptations.map(a => [a.platform, a]))

    const platformsToGenerate = dto.platforms.filter(p => !existingPlatformMap.has(p))

    if (platformsToGenerate.length === 0) {
      return dto.platforms.map(p => MaterialAdaptationVo.create(existingPlatformMap.get(p)!))
    }

    // 按限制符合性分类
    const { compliantPlatforms, nonCompliantPlatforms } = this.categorizeByCompliance(
      material,
      platformsToGenerate,
    )

    this.logger.debug(
      { materialId: dto.materialId, compliantPlatforms, nonCompliantPlatforms },
      'Categorized platforms by compliance',
    )

    const results = new Map<string, MaterialAdaptationVo>()

    // 处理符合限制的平台（只需生成配置，不需要转换内容）
    if (compliantPlatforms.length > 0) {
      const compliantResults = await this.handleCompliantPlatforms(
        material,
        compliantPlatforms,
        materialOptions,
        headers,
      )
      compliantResults.forEach(r => results.set(r.platform, r))
    }

    // 处理不符合限制的平台
    if (nonCompliantPlatforms.length > 0) {
      const nonCompliantResults = await this.handleNonCompliantPlatforms(
        material,
        nonCompliantPlatforms,
        materialOptions,
        headers,
      )
      nonCompliantResults.forEach(r => results.set(r.platform, r))
    }

    // 合并结果
    return dto.platforms.map((p) => {
      const existing = existingPlatformMap.get(p)
      if (existing) {
        return MaterialAdaptationVo.create(existing)
      }
      const result = results.get(p)
      if (!result) {
        throw new AppException(ResponseCode.MaterialAdaptationFailed, { platform: p })
      }
      return result
    })
  }

  /**
   * 按限制符合性分类平台
   */
  private categorizeByCompliance(
    material: Material,
    platforms: AccountType[],
  ): { compliantPlatforms: AccountType[], nonCompliantPlatforms: AccountType[] } {
    const content = {
      title: material.title,
      desc: material.desc,
      topics: material.topics,
    }

    const compliantPlatforms: AccountType[] = []
    const nonCompliantPlatforms: AccountType[] = []

    for (const platform of platforms) {
      if (checkPlatformLimits(platform, content)) {
        compliantPlatforms.push(platform)
      }
      else {
        nonCompliantPlatforms.push(platform)
      }
    }

    return { compliantPlatforms, nonCompliantPlatforms }
  }

  /**
   * 处理符合限制的平台：内容直接复制，必要时生成配置
   */
  private async handleCompliantPlatforms(
    material: Material,
    platforms: AccountType[],
    materialOptions: PlatformOptions | undefined,
    headers?: Record<string, string>,
  ): Promise<MaterialAdaptationVo[]> {
    // 检查哪些平台需要 AI 生成配置
    const platformsNeedingConfig = platforms.filter(p => PLATFORMS_REQUIRING_CONFIG.includes(p))

    let configResults: Record<string, Record<string, unknown>> = {}
    if (platformsNeedingConfig.length > 0) {
      configResults = await this.generateConfigsOnly(material, platformsNeedingConfig, headers)
    }

    // 存储结果
    const results: MaterialAdaptationVo[] = []
    for (const platform of platforms) {
      const platformOptionsResult = this.mergePlatformOptions(
        platform,
        materialOptions,
        configResults[platform],
      )

      const saved = await this.materialAdaptationRepository.upsertByMaterialIdAndPlatform(
        material.id,
        material.userId,
        platform,
        {
          title: material.title,
          desc: material.desc,
          topics: material.topics || [],
          platformOptions: platformOptionsResult,
        },
      )
      results.push(MaterialAdaptationVo.create(saved))
    }
    return results
  }

  /**
   * 只生成配置（简化的 AI 调用）
   */
  private async generateConfigsOnly(
    material: Material,
    platforms: AccountType[],
    headers?: Record<string, string>,
  ): Promise<Record<string, Record<string, unknown>>> {
    const mcpClient = await this.createMcpClient(headers || {})
    const modelName = 'gemini-3-flash-preview'
    const startedAt = new Date()

    try {
      const tools = (await mcpClient.getTools()).filter((tool) => {
        return ['getYoutubeContentCategories', 'getBilibiliContentCategories'].includes(tool.getName())
      })

      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: config.ai.gemini.apiKey,
        baseUrl: config.ai.gemini.baseUrl,
      })

      // 只生成配置的 schema
      const configSchema = buildConfigOnlySchema(platforms)

      const agent = createAgent({
        model,
        tools,
        responseFormat: configSchema,
      })

      const prompt = this.buildConfigOnlyPrompt(material, platforms)

      this.logger.debug({ materialId: material.id, platforms }, 'Generating configs only with MCP tools')

      const response = await agent.invoke({
        messages: [prompt],
      })

      this.logger.debug({ messages: response.messages }, 'Configs generated successfully')

      // 记录用量和扣费
      const usage = this.extractUsageFromMessages(response.messages)
      const pricing = this.getModelPricing(modelName)
      if (pricing) {
        const points = calculatePricingPoints(pricing, usage)
        const duration = Date.now() - startedAt.getTime()

        await this.creditsHelper.deductCredits({
          userId: material.userId,
          amount: points,
          type: CreditsType.AiService,
          description: 'Material Adaptation (Config Only)',
          metadata: { materialId: material.id, platforms, configOnly: true },
        })

        await this.aiLogRepo.create({
          userId: material.userId,
          userType: UserType.User,
          type: AiLogType.Agent,
          model: modelName,
          channel: AiLogChannel.Gemini,
          startedAt,
          duration,
          points,
          request: { materialId: material.id, platforms, configOnly: true },
          response: response.structuredResponse,
          status: AiLogStatus.Success,
        })
      }

      // 提取配置结果
      const result: Record<string, Record<string, unknown>> = {}
      for (const platform of platforms) {
        const platformResult = response.structuredResponse[platform]
        if (platformResult?.option) {
          result[platform] = platformResult.option
        }
      }
      return result
    }
    catch (error) {
      this.logger.error({ error, materialId: material.id, platforms }, 'Failed to generate configs')

      await this.aiLogRepo.create({
        userId: material.userId,
        userType: UserType.User,
        type: AiLogType.Agent,
        model: modelName,
        channel: AiLogChannel.Gemini,
        startedAt,
        duration: Date.now() - startedAt.getTime(),
        points: 0,
        request: { materialId: material.id, platforms, configOnly: true },
        response: undefined,
        status: AiLogStatus.Failed,
      })

      throw new AppException(ResponseCode.MaterialAdaptationFailed)
    }
    finally {
      await mcpClient.close()
    }
  }

  /**
   * 构建只生成配置的 prompt
   */
  private buildConfigOnlyPrompt(material: Material, platforms: AccountType[]): string {
    const optionRulesText = this.buildOptionRulesText(platforms)

    return `
## 任务
根据以下内容，为指定平台生成合适的发布配置。

## 原始内容
- 标题: ${material.title || '(无标题)'}
- 描述: ${material.desc || '(无描述)'}
- 话题: ${material.topics?.join(', ') || '(无话题)'}

## 目标平台
${platforms.join(', ')}

## 配置要求
${optionRulesText}

注意：只需要生成平台配置（option），不需要转换内容。
`
  }

  /**
   * 处理不符合限制的平台：完整 AI 转换
   */
  private async handleNonCompliantPlatforms(
    material: Material,
    platforms: AccountType[],
    materialOptions: PlatformOptions | undefined,
    headers?: Record<string, string>,
  ): Promise<MaterialAdaptationVo[]> {
    const mcpClient = await this.createMcpClient(headers || {})
    const modelName = 'gemini-3-flash-preview'
    const startedAt = new Date()

    try {
      const tools = (await mcpClient.getTools()).filter((tool) => {
        return ['getYoutubeContentCategories', 'getBilibiliContentCategories', 'publishRestrictions'].includes(tool.getName())
      })

      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: config.ai.gemini.apiKey,
        baseUrl: config.ai.gemini.baseUrl,
      })

      const outputSchema = buildDynamicOutputSchema(platforms)

      const agent = createAgent({
        model,
        tools,
        responseFormat: outputSchema,
      })

      const prompt = this.buildAdaptationPrompt(material, platforms)

      this.logger.debug({ materialId: material.id, platforms }, 'Adapting material with MCP tools')

      const response = await agent.invoke({
        messages: [prompt],
      })

      this.logger.debug({ messages: response.messages }, 'Material adapted successfully')

      const usage = this.extractUsageFromMessages(response.messages)
      const pricing = this.getModelPricing(modelName)
      if (pricing) {
        const points = calculatePricingPoints(pricing, usage)
        const duration = Date.now() - startedAt.getTime()

        await this.creditsHelper.deductCredits({
          userId: material.userId,
          amount: points,
          type: CreditsType.AiService,
          description: 'Material Adaptation',
          metadata: { materialId: material.id, platforms },
        })

        await this.aiLogRepo.create({
          userId: material.userId,
          userType: UserType.User,
          type: AiLogType.Agent,
          model: modelName,
          channel: AiLogChannel.Gemini,
          startedAt,
          duration,
          points,
          request: { materialId: material.id, platforms },
          response: response.structuredResponse,
          status: AiLogStatus.Success,
        })
      }

      const result = response.structuredResponse

      const results: MaterialAdaptationVo[] = []
      for (const platform of platforms) {
        const platformResult = result[platform]

        const platformOptionsResult = this.mergePlatformOptions(
          platform,
          materialOptions,
          platformResult?.option,
        )

        const adaptation = await this.materialAdaptationRepository.upsertByMaterialIdAndPlatform(
          material.id,
          material.userId,
          platform,
          {
            title: platformResult?.title,
            desc: platformResult?.desc,
            topics: platformResult?.topics || [],
            platformOptions: platformOptionsResult,
          },
        )
        results.push(MaterialAdaptationVo.create(adaptation))
      }

      return results
    }
    catch (error) {
      this.logger.error({ error, materialId: material.id, platforms }, 'Failed to adapt material')

      await this.aiLogRepo.create({
        userId: material.userId,
        userType: UserType.User,
        type: AiLogType.Agent,
        model: modelName,
        channel: AiLogChannel.Gemini,
        startedAt,
        duration: Date.now() - startedAt.getTime(),
        points: 0,
        request: { materialId: material.id, platforms },
        response: undefined,
        status: AiLogStatus.Failed,
      })

      throw new AppException(ResponseCode.MaterialAdaptationFailed)
    }
    finally {
      await mcpClient.close()
    }
  }

  private mergePlatformOptions(
    platform: string,
    existingOptions?: PlatformOptions,
    aiGeneratedOption?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    const platformKey = platform.toLowerCase() as keyof PlatformOptions
    const existingOption = existingOptions?.[platformKey]

    const mergedOption = {
      ...aiGeneratedOption,
      ...existingOption,
    }

    if (platform === AccountType.TIKTOK) {
      return {
        tiktok: {
          ...mergedOption,
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
        },
      }
    }

    if (Object.keys(mergedOption).length > 0) {
      return { [platformKey]: mergedOption }
    }

    return undefined
  }

  async updateByMaterialIdAndPlatform(
    userId: string,
    materialId: string,
    platform: string,
    dto: UpdateMaterialAdaptationDto,
  ): Promise<MaterialAdaptationVo> {
    const existing = await this.materialAdaptationRepository.getByMaterialIdAndPlatform(materialId, platform)
    if (!existing || existing.userId !== userId) {
      throw new AppException(ResponseCode.MaterialAdaptationNotFound)
    }

    const updated = await this.materialAdaptationRepository.updateByMaterialIdAndPlatform(materialId, platform, dto)
    return MaterialAdaptationVo.create(updated!)
  }

  async deleteByMaterialIdAndPlatform(userId: string, materialId: string, platform: string): Promise<void> {
    const existing = await this.materialAdaptationRepository.getByMaterialIdAndPlatform(materialId, platform)
    if (!existing || existing.userId !== userId) {
      throw new AppException(ResponseCode.MaterialAdaptationNotFound)
    }

    await this.materialAdaptationRepository.deleteByMaterialIdAndPlatform(materialId, platform)
  }

  async deleteManyByMaterialId(userId: string, materialId: string): Promise<void> {
    const material = await this.materialRepository.getInfo(materialId)
    if (!material || material.userId !== userId) {
      throw new AppException(ResponseCode.MaterialNotFound)
    }

    await this.materialAdaptationRepository.deleteManyByMaterialId(materialId)
  }

  async getByMaterialIdAndPlatform(
    materialId: string,
    platform: AccountType,
    headers: Record<string, string>,
  ): Promise<MaterialAdaptationVo> {
    const existing = await this.materialAdaptationRepository.getByMaterialIdAndPlatform(materialId, platform)
    if (existing) {
      return MaterialAdaptationVo.create(existing)
    }

    const adaptations = await this.adaptMaterial({ materialId, platforms: [platform] }, headers)
    return adaptations[0]
  }

  async listByMaterialId(materialId: string): Promise<MaterialAdaptationVo[]> {
    const adaptations = await this.materialAdaptationRepository.listByMaterialId(materialId)
    return adaptations.map(a => MaterialAdaptationVo.create(a))
  }

  private buildAdaptationPrompt(material: Material, platforms: AccountType[]): string {
    const platformRulesText = platforms
      .map(p => `- **${p}**: ${PLATFORM_RESTRICTIONS.get(p) || ''}`)
      .join('\n')

    const optionRulesText = this.buildOptionRulesText(platforms)

    return `
## 任务
将以下草稿内容适配到多个社交媒体平台。

## 核心要求（最重要）
1. **保持原意** - 必须保持原始内容的核心含义和意图不变，不得改变原意、添加新信息或删除关键信息
2. **保持风格** - 必须保持原始内容的写作风格、语气和表达方式，只在必要时进行微调以适应平台规则

## 原始内容
- 标题: ${material.title || '(无标题)'}
- 描述: ${material.desc || '(无描述)'}
- 话题: ${material.topics?.join(', ') || '(无话题)'}

## 平台规则
${platformRulesText}

## 适配要求
1. **保持原意** - 核心信息和意图必须与原始内容一致
2. **保持风格** - 保留原始的写作风格和语气
3. **遵守限制** - 严格遵守各平台字符限制
4. **优化格式** - 仅在必要时调整格式以适应平台
5. **话题标签** - 生成适合各平台的话题标签（不含#前缀）

## 平台配置（option）
为每个平台生成合适的发布配置，使用工具获取可用的分类/分区信息：
${optionRulesText}
`
  }

  private buildOptionRulesText(platforms: string[]): string {
    const rules: string[] = []

    for (const platform of platforms) {
      switch (platform) {
        case AccountType.BILIBILI:
          rules.push(`- **BILIBILI**: 调用 getBilibiliContentCategories 获取分区列表，根据内容选择合适的 tid；copyright 默认 1（原创），no_reprint 默认 0（允许转载）`)
          break
        case AccountType.YOUTUBE:
          rules.push(`- **YOUTUBE**: 调用 getYoutubeContentCategories 获取分类列表，根据内容选择合适的 categoryId；privacyStatus 默认 public，license 默认 youtube`)
          break
        case AccountType.TIKTOK:
          rules.push(`- **TIKTOK**: privacy_level 根据内容选择（PUBLIC_TO_EVERYONE/MUTUAL_FOLLOW_FRIENDS/SELF_ONLY）`)
          break
        case AccountType.FACEBOOK:
          rules.push(`- **FACEBOOK**: content_category 根据内容形式选择（post/reel/story）`)
          break
        case AccountType.INSTAGRAM:
          rules.push(`- **INSTAGRAM**: content_category 根据内容形式选择（post/reel/story）`)
          break
        case AccountType.THREADS:
          rules.push(`- **THREADS**: location_id 可为空`)
          break
      }
    }

    return rules.join('\n')
  }

  private extractUsageFromMessages(messages: BaseMessage[]): {
    input_tokens: number
    output_tokens: number
    input_token_details?: TokenUsageDetails
    output_token_details?: TokenUsageDetails
  } {
    let inputTokens = 0
    let outputTokens = 0
    const inputTokenDetails: TokenUsageDetails = {}
    const outputTokenDetails: TokenUsageDetails = {}

    const mergeTokenDetails = (target: TokenUsageDetails, source?: TokenUsageDetails) => {
      if (!source) {
        return
      }

      target.text = (target.text || 0) + (source.text || 0)
      target.image = (target.image || 0) + (source.image || 0)
      target.audio = (target.audio || 0) + (source.audio || 0)
      target.video = (target.video || 0) + (source.video || 0)
    }

    for (const msg of messages) {
      if (AIMessage.isInstance(msg)) {
        const usage = msg.usage_metadata
        if (usage) {
          inputTokens += usage.input_tokens || 0
          outputTokens += usage.output_tokens || 0
          mergeTokenDetails(inputTokenDetails, usage.input_token_details as TokenUsageDetails | undefined)
          mergeTokenDetails(outputTokenDetails, usage.output_token_details as TokenUsageDetails | undefined)
        }
      }
    }
    return {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      input_token_details: Object.values(inputTokenDetails).some(v => (v || 0) > 0) ? inputTokenDetails : undefined,
      output_token_details: Object.values(outputTokenDetails).some(v => (v || 0) > 0) ? outputTokenDetails : undefined,
    }
  }

  private getModelPricing(modelName: string): ChatPricing | null {
    const chatModel = config.ai.models.chat.find(m => m.name === modelName)
    if (!chatModel) {
      return null
    }
    return chatModel.pricing as ChatPricing
  }
}
