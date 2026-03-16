import { AIMessageChunk, BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { OpenaiConfig } from './openai.config'
import { SoraCharacterResponse, SoraCreateCharacterRequest } from './openai.interface'

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name)
  private readonly openAI: OpenAI
  private readonly chatOpenAI: ChatOpenAI

  constructor(
    private readonly config: OpenaiConfig,
  ) {
    this.openAI = this._createOpenAIClient()
    this.chatOpenAI = this._createChatModel({})
  }

  private _createOpenAIClient(): OpenAI {
    return new OpenAI({
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
    const {
      messages,
    } = options

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
      if (result) {
        result = result.concat(chunk)
      }
      else {
        result = chunk
      }
    }

    return result!
  }

  async createImageGeneration(options: Omit<OpenAI.Images.ImageGenerateParams, 'user' | 'stream'>): Promise<OpenAI.Images.ImagesResponse> {
    return this.openAI.images.generate(options)
  }

  async createImageEdit(options: Omit<OpenAI.Images.ImageEditParams, 'user' | 'stream'>): Promise<OpenAI.Images.ImagesResponse> {
    return this.openAI.images.edit(options)
  }

  async createImageVariation(options: Omit<OpenAI.Images.ImageCreateVariationParams, 'user'>): Promise<OpenAI.Images.ImagesResponse> {
    return this.openAI.images.createVariation(options)
  }

  private normalizeVideoTimestamp(video: OpenAI.Videos.Video): OpenAI.Videos.Video {
    // 判断阈值：10000000000 对应 2001-09-09
    // 大于此值则认为是毫秒值，需转换为秒值
    if (video.created_at > 10000000000) {
      return {
        ...video,
        created_at: Math.floor(video.created_at / 1000),
      }
    }
    return video
  }

  async createVideo(params: OpenAI.VideoCreateParams): Promise<OpenAI.Videos.Video> {
    const video = await this.openAI.videos.create(params)
    return this.normalizeVideoTimestamp(video)
  }

  async retrieveVideo(videoId: string): Promise<OpenAI.Videos.Video> {
    const video = await this.openAI.videos.retrieve(videoId)
    return this.normalizeVideoTimestamp(video)
  }

  async listVideos(params?: OpenAI.VideoListParams): Promise<OpenAI.Videos.VideosPage> {
    const result = await this.openAI.videos.list(params)
    result.data = result.data.map(video => this.normalizeVideoTimestamp(video))
    return result
  }

  async deleteVideo(videoId: string): Promise<OpenAI.Videos.VideoDeleteResponse> {
    return this.openAI.videos.delete(videoId)
  }

  async downloadVideoContent(videoId: string, variant?: 'video' | 'thumbnail' | 'spritesheet'): Promise<Response> {
    return this.openAI.videos.downloadContent(videoId, { variant })
  }

  async remixVideo(videoId: string, prompt: string): Promise<OpenAI.Videos.Video> {
    const video = await this.openAI.videos.remix(videoId, { prompt })
    return this.normalizeVideoTimestamp(video)
  }

  async createCharacter(params: SoraCreateCharacterRequest): Promise<SoraCharacterResponse> {
    const response = await this.openAI.videos.create(params as unknown as OpenAI.VideoCreateParams)
    return response as unknown as SoraCharacterResponse
  }

  async getCharacter(characterId: string): Promise<SoraCharacterResponse> {
    const response = await this.openAI.videos.retrieve(characterId)
    return response as unknown as SoraCharacterResponse
  }
}
