import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../ai/core/chat'

@ApiTags('内部服务接口')
@Controller('internal')
export class AIController {
  constructor(private readonly chatService: ChatService) { }

  @ApiOperation({ summary: 'create publish record' })
  @Post('ai/chat/completion')
  async chatCompletion(@Body() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }
}
