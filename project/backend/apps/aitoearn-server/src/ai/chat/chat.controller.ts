import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { ChatCompletionDto } from './chat.dto'
import { ChatService } from './chat.service'
import { ChatCompletionVo, ChatModelConfigVo } from './chat.vo'

@ApiTags('OpenSource/Me/Ai')
@Controller('ai')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiDoc({
    summary: 'Get Chat Model Parameters',
    response: [ChatModelConfigVo],
  })
  @Public()
  @Get('/models/chat')
  async getChatModels(@GetToken() token?: TokenInfo): Promise<ChatModelConfigVo[]> {
    const response = await this.chatService.getChatModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map(item => ChatModelConfigVo.create(item))
  }

  @ApiDoc({
    summary: 'AI Chat Conversation',
    body: ChatCompletionDto.schema,
    response: ChatCompletionVo,
  })
  @Post('/chat')
  async chat(@GetToken() token: TokenInfo, @Body() body: ChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ChatCompletionVo.create(response)
  }
}
