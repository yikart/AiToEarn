import { Body, Controller, Post } from '@nestjs/common'
import { ChatModelsQueryDto, UserChatCompletionDto } from './chat.dto'
import { ChatService } from './chat.service'
import { ChatCompletionVo, ChatModelConfigVo } from './chat.vo'

@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  // @NatsMessagePattern('ai.chat.completion')
  @Post('ai/chat/completion')
  async chatCompletion(@Body() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }

  // @NatsMessagePattern('ai.chat.models')
  @Post('ai/chat/models')
  async getChatModels(@Body() data: ChatModelsQueryDto): Promise<ChatModelConfigVo[]> {
    const response = await this.chatService.getChatModelConfig(data)
    return response.map(item => ChatModelConfigVo.create(item))
  }
}
