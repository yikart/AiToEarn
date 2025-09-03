import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { OpenAIClient } from '@langchain/openai'
import { OpenaiService } from '@libs/openai'
import { Injectable, Logger } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { AppException, ResponseCode } from '@yikart/common'
import { BigNumber } from 'bignumber.js'
import { config } from '../../config'
import { ChatCompletionDto, UserChatCompletionDto } from './chat.dto'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly userClient: AitoearnUserClient,
  ) {}

  async chatCompletion(request: ChatCompletionDto) {
    const { messages, model, ...params } = request

    const langchainMessages: BaseMessage[] = messages.map((message) => {
      if (message.role === 'system') {
        return new SystemMessage(message)
      }
      else {
        return new HumanMessage(message)
      }
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
      content: result.content,
      model,
      usage,
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
    await this.userClient.deductPoints({
      userId,
      amount,
      type: 'ai_service',
      description,
      metadata,
    })
  }

  async userChatCompletion({ userId, ...params }: UserChatCompletionDto) {
    const modelConfig = config.ai.models.chat.find(m => m.name === params.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const pricing = Number(modelConfig.pricing)

    const { balance } = await this.userClient.getPointsBalance({ userId })
    if (balance < pricing) {
      throw new AppException(ResponseCode.UserPointsInsufficient)
    }

    const result = await this.chatCompletion(params)

    const { usage } = result

    const prompt = new BigNumber(usage.input_tokens).div('1000').times(modelConfig.pricing.prompt)
    const completion = new BigNumber(usage.output_tokens).div('1000').times(modelConfig.pricing.completion)
    const points = prompt.plus(completion).toNumber()

    await this.deductUserPoints(
      userId,
      points,
      modelConfig.name,
      usage,
    )

    return {
      ...result,
      usage: {
        ...usage,
        points,
      },
    }
  }

  /**
   * 获取视频生成模型参数
   */
  async getChatModelConfig() {
    return config.ai.models.chat
  }
}
