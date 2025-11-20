import { BaseMessage, ChatMessage } from '@langchain/core/messages'
import { OpenAIClient } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { BigNumber } from 'bignumber.js'
import dayjs from 'dayjs'
import _ from 'lodash'
import OpenAI from 'openai'
import { PointsService } from '../../user/points.service'
import { UserService } from '../../user/user.service'
import { OpenaiService } from '../libs/openai'
import { ModelsConfigService } from '../models-config'
import { ChatCompletionDto, ChatModelsQueryDto, UserChatCompletionDto } from './chat.dto'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private readonly userService: UserService,
    private readonly openaiService: OpenaiService,
    private readonly pointsService: PointsService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly modelsConfigService: ModelsConfigService,
  ) {}

  async chatCompletion(request: ChatCompletionDto) {
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
      throw new AppException(ResponseCode.AiCallFailed)
    }

    return {
      model,
      usage,
      ...result,
    }
  }

  /**
   * 扣减用户积分
   * @param userId 用户ID
   * @param amount 扣减积分数量
   * @param description 积分变动描述
   * @param metadata 额外信息
   */
  async deductUserPoints(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.pointsService.deductPoints({
      userId,
      amount,
      type: 'ai_service',
      description,
      metadata,
    })
  }

  async userChatCompletion({ userId, userType, ...params }: UserChatCompletionDto) {
    const modelConfig = (await this.getChatModelConfig({ userId, userType })).find((m: { name: string }) => m.name === params.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const pricing = modelConfig.pricing
    if (userType === UserType.User) {
      const balance = await this.pointsService.getBalance(userId)
      if (balance < 0) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
      if ('price' in pricing) {
        const price = Number(pricing.price)
        if (balance < price) {
          throw new AppException(ResponseCode.UserPointsInsufficient)
        }
      }
    }

    const startedAt = new Date()

    const result = await this.chatCompletion(params)

    const duration = Date.now() - startedAt.getTime()

    const { usage } = result

    let points = 0
    if ('price' in pricing) {
      points = Number(pricing.price)
    }
    else {
      const prompt = new BigNumber(usage.input_tokens).div('1000').times(pricing.prompt)
      const completion = new BigNumber(usage.output_tokens).div('1000').times(pricing.completion)
      points = prompt.plus(completion).toNumber()
    }

    this.logger.debug({
      points,
      usage,
      modelConfig,
    })

    if (userType === UserType.User) {
      await this.deductUserPoints(
        userId,
        points,
        modelConfig.name,
        usage,
      )
    }

    await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      startedAt,
      duration,
      type: AiLogType.Chat,
      points,
      request: params,
      response: result,
      status: AiLogStatus.Success,
    })

    return {
      ...result,
      usage: {
        ...usage,
        points,
      },
    }
  }

  /**
   * 获取聊天模型参数
   * @param data 查询参数，包含可选的 userId 和 userType，可用于后续个性化模型推荐
   */
  async getChatModelConfig(data: ChatModelsQueryDto) {
    if (data.userType === UserType.User && data.userId) {
      try {
        const user = await this.userService.getUserInfoById(data.userId)
        if (user && user.vipInfo && dayjs(user.vipInfo.expireTime).isAfter(dayjs())) {
          const models = _.cloneDeep(this.modelsConfigService.config.chat)
          // 将所有标记为 freeForVip 的模型价格设为 0
          models.forEach((model) => {
            if (model.freeForVip) {
              model.pricing = { price: '0' }
            }
          })
          return models
        }
      }
      catch (error) {
        this.logger.warn({ error })
      }
    }

    return this.modelsConfigService.config.chat
  }

  // 智能图片文案
  async imgContentByAi(user: { userId: string, userType: UserType }, model: string, imgUrl: string, prompt: string, option?: {
    title?: string
    desc?: string
    max?: number
    language?: string
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const systemContent = option?.systemPrompt || `Generate copy based on the pictures and prompt words, as well as the reference titles and contents. Reply in ${option?.language || 'English'}. The reply should not exceed ${option?.max || 100} characters. Just return the copy.`
    let text = `prompt${prompt}.`
    if (option?.title)
      text += `Reference Title: ${option.title}`
    if (option?.desc)
      text += `Reference description: ${option.desc}`

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imgUrl,
              },
            },
            {
              type: 'text',
              text,
            },
          ],
        },
      ],
    }

    try {
      const res = await this.userChatCompletion(request)
      return res.content as string || ''
    }
    catch (error) {
      this.logger.log({ data: error, path: '======= imgContentByAi error =======' })
      return ''
    }
  }

  // 智能视频文案
  async videoContentByAi(user: { userId: string, userType: UserType }, model: string, videoUrl: string, prompt: string, option?: {
    title?: string
    desc?: string
    max?: number
    language?: string
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const systemContent = option?.systemPrompt || `Generate copy based on the video and prompt words, as well as the reference titles and contents. Reply in ${option?.language || 'English'}. The reply should not exceed ${option?.max || 100} characters. Just return the copy.`
    let text = `prompt${prompt}.`
    if (option?.title)
      text += `Reference Title: ${option.title}`
    if (option?.desc)
      text += `Reference description: ${option.desc}`

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: [
            {
              type: 'video',
              video_url: {
                url: videoUrl,
              },
            },
            {
              type: 'text',
              text,
            },
          ],
        },
      ],
    }

    const res = await this.userChatCompletion(request)
    return res.content as string || ''
  }

  // 根据图片返回文字内容
  async getContentByAi(user: { userId: string, userType: UserType }, model: string, prompt: string, option: {
    coverUrl?: string
    title?: string
    desc?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!option.desc && !option.coverUrl)
      return ''

    const systemContent = `Based on the cover image, refer to the title and the original content to generate beautiful copy. Reply in ${option.language || 'English'} and the content of your reply should not exceed ${option.max || 100} words. Just return the copy`

    let text = `prompt${prompt}.`
    if (option.title)
      text += `Reference Title: ${option.title}`
    if (option.desc)
      text += `Reference description: ${option.desc}`

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text,
      },
    ]

    if (option.coverUrl) {
      content.push({
        type: 'image_url',
        image_url: {
          url: option.coverUrl,
        },
      })
    }
    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content,
        },
      ],
    }

    const res = await this.userChatCompletion(request)
    return res.content as string || ''
  }

  // 根据图片返回文字内容
  async getTitleByAi(user: { userId: string, userType: UserType }, model: string, desc: string, option: {
    title?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!desc)
      return ''

    const systemContent = `Generate the content title based on the reference title and the original content. Please reply in ${option.language || 'English'} and the content of your reply should not exceed  ${option.max || 100} words. Just return the title text`

    let text = `Original content: ${desc}. `
    if (option.title)
      text += `Reference Title: ${option.title}`

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text,
      },
    ]

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content,
        },
      ],
    }

    const res = await this.userChatCompletion(request)
    return res.content as string || ''
  }
}
