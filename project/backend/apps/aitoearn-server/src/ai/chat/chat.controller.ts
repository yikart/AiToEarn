import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { ChatCompletionDto } from './chat.dto'
import { ChatService } from './chat.service'
import { ChatCompletionVo } from './chat.vo'

@ApiTags('OpenSource/Me/Ai')
@Controller('ai')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
