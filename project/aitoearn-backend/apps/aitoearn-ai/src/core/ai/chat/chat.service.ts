import Anthropic from '@anthropic-ai/sdk'
import { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources'
import { GenerateContentResponse, GenerateContentResponseUsageMetadata } from '@google/genai'
import { BaseMessage, ChatMessage } from '@langchain/core/messages'
import { OpenAIClient } from '@langchain/openai'
import { Injectable, Logger, Optional } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, getErrorMessage, getErrorStack, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import OpenAI from 'openai'
import { from, merge, Observable } from 'rxjs'
import { catchError, concatMap, ignoreElements, last, share } from 'rxjs/operators'
import { config } from '../../../config'
import { AiAvailabilityService } from '../../ai-availability'
import { GeminiService } from '../libs/gemini/gemini.service'
import { OpenaiService } from '../libs/openai'
import { ModelsConfigService } from '../models-config'
import { RelayMediaResolverService } from '../relay-media'
import {
  ChatCompletionDto,
  ChatModelsQueryDto,
  ChatStreamProxyDto,
  UserChatCompletionDto,
  UserClaudeChatProxyDto,
  UserGeminiGenerateContentDto,
} from './chat.dto'

type DeepSeekChatCompletionUsage = NonNullable<OpenAI.Chat.ChatCompletionChunk['usage']> & {
  prompt_cache_hit_tokens?: number
  prompt_cache_miss_tokens?: number
}

interface TokenUsageDetails {
  text?: number
  image?: number
  audio?: number
  video?: number
  cache_read?: number
  cache_creation_5m?: number
  cache_creation_1h?: number
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  private readonly anthropic = new Anthropic({
    apiKey: config.ai.anthropic.apiKey,
    baseURL: config.ai.anthropic.baseUrl,
  })

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly assetsService: AssetsService,
    private readonly geminiService: GeminiService,
    private readonly aiAvailability: AiAvailabilityService,
    @Optional() private readonly relayMediaResolver?: RelayMediaResolverService,
  ) {}

  /**
   * 处理 content 中的 base64 图片，上传并替换 URL
   */
  private async processBase64Images(content: string | unknown[], model: string, userId: string): Promise<string | unknown[]> {
    if (typeof content === 'string') {
      const base64ImageRegex = /data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g
      const matches = Array.from(content.matchAll(base64ImageRegex))

      if (matches.length > 0) {
        let processedContent = content
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i]
          const fullMatch = match[0]
          const matchIndex = match.index!
          const imageTypeName = match[1]
          const imageData = match[2]
          const mimeType = imageTypeName === 'jpg' ? 'jpeg' : imageTypeName
          const fullMimeType = `image/${mimeType}`
          const buffer = Buffer.from(imageData, 'base64')
          const result = await this.assetsService.uploadFromBuffer(userId, buffer, {
            type: AssetType.AiChatImage,
            mimeType: fullMimeType,
          }, model)
          const url = this.assetsService.buildUrl(result.asset.path)

          const before = processedContent.substring(0, matchIndex)
          const after = processedContent.substring(matchIndex + fullMatch.length)
          processedContent = `${before}${url}${after}`
        }
        return processedContent
      }
    }
    return content
  }

  /**
   * 处理 AIMessageChunk 的 content 中的 base64 图片
   */
  private async processAIMessageChunkContent(
    content: string | unknown[] | undefined,
    model: string,
    userId: string,
  ): Promise<string | unknown[] | undefined> {
    if (!content) {
      return content
    }
    if (typeof content === 'string') {
      return await this.processBase64Images(content, model, userId) as string
    }
    if (Array.isArray(content)) {
      return await Promise.all(
        content.map(async (item) => {
          if (typeof item === 'object' && item !== null && 'text' in item && typeof item.text === 'string') {
            return {
              ...item,
              text: await this.processBase64Images(item.text, model, userId) as string,
            }
          }
          return item
        }),
      )
    }
    return content
  }

  async chatCompletion(request: ChatCompletionDto, userId: string) {
    const { messages, model, ...params } = request

    const langchainMessages: BaseMessage[] = messages.map((message) => {
      return new ChatMessage(message)
    })

    const result = await this.openaiService.createChatCompletion({
      model,
      messages: langchainMessages,
      ...params,
      modalities: params.modalities as OpenAIClient.Chat.ChatCompletionModality[],
    })

    const usage = result.usage_metadata
    if (!usage) {
      throw new AppException(ResponseCode.AiCallFailed, { error: 'Missing usage metadata' })
    }

    // 处理返回的 content 中的 base64 图片
    result.content = await this.processAIMessageChunkContent(result.content, model, userId) as typeof result.content

    return {
      model,
      usage,
      ...result,
    }
  }

  private async handleCompletion(
    params: ChatCompletionDto,
    userId: string,
    userType: UserType,
    modelConfig: { name: string, channel: AiLogChannel },
    startedAt: Date,
    usage: { input_tokens?: number, output_tokens?: number, total_tokens?: number, input_token_details?: TokenUsageDetails, output_token_details?: TokenUsageDetails },
    result: { model: string, usage: typeof usage },
  ): Promise<void> {
    this.logger.debug({
      usage,
      modelConfig,
    })

    const duration = Date.now() - startedAt.getTime()

    await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: modelConfig.channel,
      startedAt,
      duration,
      type: AiLogType.Chat,
      request: params as unknown as Record<string, unknown>,
      response: result,
      status: AiLogStatus.Success,
    })
  }

  async userChatCompletion({ userId, userType, ...params }: UserChatCompletionDto) {
    const modelConfig = (await this.getChatModelConfig({ userId, userType })).find((m: { name: string }) => m.name === params.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const startedAt = new Date()

    const result = await this.chatCompletion(params, userId)

    const { usage } = result

    await this.handleCompletion(
      params,
      userId,
      userType,
      modelConfig,
      startedAt,
      usage,
      result,
    )

    return result
  }

  /**
   * 获取聊天模型参数
   * @param data 查询参数，包含可选的 userId 和 userType，可用于后续个性化模型推荐
   */
  async getChatModelConfig(data: ChatModelsQueryDto) {
    let models = this.modelsConfigService.config.chat

    if (data.channel) {
      models = models.filter(m => m.channel === data.channel)
    }

    if (data.scene) {
      models = models.filter(m => m.scenes?.includes(data.scene!))
    }

    return models
  }

  private async processChunkContent(
    chunk: OpenAI.Chat.ChatCompletionChunk,
    model: string,
    userId: string,
  ): Promise<OpenAI.Chat.ChatCompletionChunk> {
    const choice = chunk.choices[0]
    if (!choice?.delta?.content) {
      return chunk
    }

    const content = choice.delta.content
    const processedContent = await this.processBase64Images(content, model, userId)
    if (processedContent !== content) {
      return {
        ...chunk,
        choices: [{
          ...choice,
          delta: {
            ...choice.delta,
            content: processedContent as string,
          },
        }],
      }
    }
    return chunk
  }

  async proxyChatStream(
    params: ChatStreamProxyDto & { userId: string, userType: UserType },
  ): Promise<Observable<OpenAI.Chat.ChatCompletionChunk>> {
    const { userId, userType, model, ...body } = params

    const modelConfig = (await this.getChatModelConfig({ userId, userType }))
      .find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const startedAt = new Date()

    const stream = await this.openaiService.createRawStream({
      ...body,
      model,
      stream: true,
      stream_options: { include_usage: true },
    } as OpenAI.Chat.ChatCompletionCreateParamsStreaming)

    const stream$ = from(stream as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>).pipe(share())

    const contentStream$ = stream$.pipe(
      concatMap(chunk => this.processChunkContent(chunk, model, userId)),
    )

    const billingStream$ = stream$.pipe(
      last(),
      concatMap(async (lastChunk) => {
        if (lastChunk.usage) {
          const usage: DeepSeekChatCompletionUsage = lastChunk.usage
          const cacheReadTokens = usage.prompt_cache_hit_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? 0
          const inputTokens = usage.prompt_cache_miss_tokens ?? Math.max((usage.prompt_tokens || 0) - cacheReadTokens, 0)
          const finalUsage = {
            input_tokens: inputTokens,
            output_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            input_token_details: { cache_read: cacheReadTokens },
          }
          await this.handleCompletion(
            { model } as ChatCompletionDto,
            userId,
            userType,
            modelConfig,
            startedAt,
            finalUsage,
            { model, usage: finalUsage },
          )
        }

        await this.aiAvailability.recordSuccess(
          { provider: 'openai', operation: 'proxyChatStream', model },
          Date.now() - startedAt.getTime(),
        )
      }),
      ignoreElements(),
    )

    return merge(contentStream$, billingStream$).pipe(
      catchError((error) => {
        void this.aiAvailability.recordFailure(
          { provider: 'openai', operation: 'proxyChatStream', model },
          error,
          Date.now() - startedAt.getTime(),
        )
        this.logger.error(`Proxy stream error: ${getErrorMessage(error)}`)
        throw error
      }),
    )
  }

  /**
   * Claude 流式对话（透传）
   * 返回 Observable<RawMessageStreamEvent> 原始事件流
   */
  async proxyClaudeChatStream({ userId, userType, ...params }: UserClaudeChatProxyDto): Promise<Observable<RawMessageStreamEvent>> {
    const body = params
    const modelConfig = (await this.getChatModelConfig({ userId, userType })).find((m: { name: string }) => m.name === params.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const startedAt = new Date()

    const resolvedBody = await this.resolveRelayJson(body)
    const stream = this.anthropic.messages.stream(resolvedBody as Anthropic.MessageStreamParams)

    const stream$ = from(stream).pipe(
      share(),
    )

    const contentStream$ = stream$

    const completeStream$ = stream$.pipe(
      last(),
      concatMap(async () => {
        const finalMessage = await stream.finalMessage()
        const usage = finalMessage.usage
        const cacheCreation = usage.cache_creation
        const inputTokenDetails: TokenUsageDetails = {
          cache_read: usage.cache_read_input_tokens ?? 0,
          cache_creation_5m: cacheCreation?.ephemeral_5m_input_tokens ?? usage.cache_creation_input_tokens ?? 0,
          cache_creation_1h: cacheCreation?.ephemeral_1h_input_tokens ?? 0,
        }
        const finalUsage = {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          input_token_details: inputTokenDetails,
        }

        await this.handleCompletion(
          { model: params.model, messages: params.messages as ChatCompletionDto['messages'] },
          userId,
          userType,
          modelConfig,
          startedAt,
          finalUsage,
          { model: params.model, usage: finalUsage },
        )

        await this.aiAvailability.recordSuccess(
          { provider: 'anthropic', operation: 'proxyClaudeChatStream', model: params.model },
          Date.now() - startedAt.getTime(),
        )
      }),
      ignoreElements(),
    )

    return merge(contentStream$, completeStream$).pipe(
      catchError((error) => {
        void this.aiAvailability.recordFailure(
          { provider: 'anthropic', operation: 'proxyClaudeChatStream', model: params.model },
          error,
          Date.now() - startedAt.getTime(),
        )
        this.logger.error(`Error in proxyClaudeChatStream: ${getErrorMessage(error)}`, getErrorStack(error))
        throw error
      }),
    )
  }

  /**
   * Gemini generateContent（通用内容生成，支持视频/音频/图片分析）
   */
  async userGeminiGenerateContent(request: UserGeminiGenerateContentDto) {
    const { userId, userType, model, ...params } = request

    // 获取模型配置
    const modelConfig = (await this.getChatModelConfig({ userId, userType }))
      .find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const startedAt = new Date()

    let result: GenerateContentResponse | undefined
    let usage: GenerateContentResponseUsageMetadata | undefined

    try {
      // 调用 Gemini generateContent
      const responses = await this.geminiService.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      })

      for await (const chunk of responses) {
        usage = chunk.usageMetadata

        if (!result) {
          result = chunk
        }
        else {
          const existingParts = result.candidates?.[0]?.content?.parts || []
          const newParts = chunk.candidates?.[0]?.content?.parts || []
          if (result.candidates?.[0]?.content) {
            result.candidates[0].content.parts = [...existingParts, ...newParts]
          }
          result.usageMetadata = chunk.usageMetadata
        }
      }

      await this.aiAvailability.recordSuccess(
        { provider: 'gemini', operation: 'generateContentStream', model },
        Date.now() - startedAt.getTime(),
      )
    }
    catch (error) {
      await this.aiAvailability.recordFailure(
        { provider: 'gemini', operation: 'generateContentStream', model },
        error,
        Date.now() - startedAt.getTime(),
      )
      throw error
    }

    const finalUsage = this.buildGeminiUsage(usage)

    await this.handleCompletion(
      { model, messages: [] },
      userId,
      userType,
      modelConfig,
      startedAt,
      finalUsage,
      { model, usage: finalUsage },
    )

    return result!
  }

  /**
   * 将 Gemini usageMetadata 转换为统一 usage 结构。
   */
  buildGeminiUsage(usage: GenerateContentResponseUsageMetadata | undefined): {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    input_token_details: TokenUsageDetails
    output_token_details: TokenUsageDetails | undefined
  } {
    const inputTokenDetails = this.extractGeminiTokenDetails(usage?.promptTokensDetails) ?? {}
    const outputTokenDetails = this.extractGeminiTokenDetails(usage?.candidatesTokensDetails)
    const cacheReadTokens = usage?.cachedContentTokenCount || 0
    if (inputTokenDetails.text) {
      inputTokenDetails.text = Math.max(inputTokenDetails.text - cacheReadTokens, 0)
    }
    inputTokenDetails.cache_read = cacheReadTokens

    return {
      input_tokens: cacheReadTokens > 0 ? Math.max((usage?.promptTokenCount || 0) - cacheReadTokens, 0) : usage?.promptTokenCount || 0,
      output_tokens: usage?.candidatesTokenCount || 0,
      total_tokens: usage?.totalTokenCount || 0,
      input_token_details: inputTokenDetails,
      output_token_details: outputTokenDetails,
    }
  }

  private async resolveRelayJson<T>(value: T): Promise<T> {
    if (!this.relayMediaResolver) {
      return value
    }
    return await this.relayMediaResolver.resolveJson(value)
  }

  extractGeminiTokenDetails(details: GenerateContentResponseUsageMetadata['promptTokensDetails']): TokenUsageDetails | undefined {
    if (!details) {
      return undefined
    }

    const result: TokenUsageDetails = {}
    for (const detail of details) {
      const rawModality = detail.modality
      const rawTokenCount = detail.tokenCount
      if (typeof rawModality !== 'string' || typeof rawTokenCount !== 'number' || rawTokenCount <= 0) {
        continue
      }

      const modality = rawModality.toLowerCase()
      if (modality.includes('text')) {
        result.text = (result.text || 0) + rawTokenCount
      }
      else if (modality.includes('image')) {
        result.image = (result.image || 0) + rawTokenCount
      }
      else if (modality.includes('audio')) {
        result.audio = (result.audio || 0) + rawTokenCount
      }
      else if (modality.includes('video')) {
        result.video = (result.video || 0) + rawTokenCount
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }
}
