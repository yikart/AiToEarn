import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { UserChatCompletionDto } from './chat.dto'
import { ChatService } from './chat.service'
import { ChatCompletionVo, ChatModelConfigVo } from './chat.vo'

@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @NatsMessagePattern('ai.chat.completion')
  async chatCompletion(@Payload() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }

  @NatsMessagePattern('ai.chat.models')
  async getChatModels(): Promise<ChatModelConfigVo[]> {
    const response = await this.chatService.getChatModelConfig()
    return response.map(item => ChatModelConfigVo.create(item))
  }
}
