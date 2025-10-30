import { AIMessageChunk, BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { OpenaiConfig } from './openai.config'

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name)
  private readonly openAI: OpenAI
  private readonly chatOpenAI: ChatOpenAI

  constructor(private readonly config: OpenaiConfig) {
    this.openAI = this._createOpenAIClient()
    this.chatOpenAI = this._createChatModel({})
  }

  private _createOpenAIClient(apiKey?: string): OpenAI {
    return new OpenAI({
      apiKey: apiKey ?? this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    })
  }

  private _createChatModel(options: Partial<OpenAIChatInput> & {
    apiKey?: string
  }): ChatOpenAI {
    return new ChatOpenAI({
      ...options,
      maxRetries: 1,
      timeout: options.timeout ?? this.config.timeout,
      apiKey: options.apiKey ?? this.config.apiKey,
      configuration: {
        baseURL: this.config.baseUrl,
      },
      streaming: true,
    })
  }

  async createChatCompletionStream(options: Partial<OpenAIChatInput> & {
    model: string
    messages: BaseMessage[]
  }) {
    const {
      messages,
    } = options

    const chatModel = this._createChatModel(options)
    return await chatModel.stream(messages, options)
  }

  async createChatCompletion(options: Partial<OpenAIChatInput> & {
    model: string
    messages: BaseMessage[]
  }): Promise<AIMessageChunk> {
    const stream = await this.createChatCompletionStream(options)
    let result: AIMessageChunk | undefined

    for await (const chunk of stream) {
      if (result) {
        result = result.concat(chunk)
      }
      else {
        result = chunk
      }
    }

    this.logger.debug(`usage_metadata: ${JSON.stringify(result!.usage_metadata, null, 2)}`)

    return result!
  }

  async createImageGeneration(options: Omit<OpenAI.Images.ImageGenerateParams, 'user' | 'stream'> & { apiKey?: string }): Promise<OpenAI.Images.ImagesResponse> {
    const { apiKey, ...imageParams } = options
    const client = this._createOpenAIClient(apiKey)
    return client.images.generate(imageParams)
  }

  async createImageEdit(options: Omit<OpenAI.Images.ImageEditParams, 'user' | 'stream'> & { apiKey?: string }): Promise<OpenAI.Images.ImagesResponse> {
    const { apiKey, ...editParams } = options
    const client = this._createOpenAIClient(apiKey)
    return client.images.edit(editParams)
  }

  async createImageVariation(options: Omit<OpenAI.Images.ImageCreateVariationParams, 'user'> & { apiKey?: string }): Promise<OpenAI.Images.ImagesResponse> {
    const { apiKey, ...variationParams } = options
    const client = this._createOpenAIClient(apiKey)
    return client.images.createVariation(variationParams)
  }
}
