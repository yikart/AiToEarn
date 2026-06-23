import { AIMessageChunk, BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { AtlascloudConfig } from './atlascloud.config'

/**
 * Atlas Cloud is OpenAI-compatible, so this service reuses the OpenAI SDK /
 * LangChain ChatOpenAI client and only swaps the base URL + key. It exposes the
 * same chat surface as the built-in OpenAI provider and can back any chat model
 * registered with `channel: 'atlascloud'`.
 */
@Injectable()
export class AtlascloudService {
  private readonly logger = new Logger(AtlascloudService.name)
  private readonly openAI: OpenAI

  constructor(
    private readonly config: AtlascloudConfig,
  ) {
    this.openAI = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    })
  }

  private _createChatModel(options: Partial<OpenAIChatInput>): ChatOpenAI {
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
    const { messages } = options
    const chatModel = this._createChatModel(options)
    return await chatModel.stream(messages, options)
  }

  async createRawStream(options: OpenAI.Chat.ChatCompletionCreateParamsStreaming) {
    return this.openAI.chat.completions.create(options)
  }

  async createChatCompletion(options: Partial<OpenAIChatInput> & {
    model: string
    messages: BaseMessage[]
  }): Promise<AIMessageChunk> {
    const stream = await this.createChatCompletionStream(options)
    let result: AIMessageChunk | undefined

    for await (const chunk of stream) {
      result = result ? result.concat(chunk) : chunk
    }

    return result!
  }
}
