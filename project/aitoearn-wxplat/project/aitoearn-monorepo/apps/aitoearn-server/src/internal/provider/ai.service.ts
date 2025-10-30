import { Injectable } from '@nestjs/common'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../../ai/core/chat'

@Injectable()
export class AIInternalService {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  async chatCompletion(data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    return this.chatService.userChatCompletion(data)
  }
}
