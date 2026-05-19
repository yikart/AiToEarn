import { Body, Controller, Get, Post, Query, SetMetadata } from '@nestjs/common'
import { SSE_METADATA } from '@nestjs/common/constants'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType, ZodValidationPipe } from '@yikart/common'
import { AiLogChannel } from '@yikart/mongodb'
import { ChatCompletionDto, ChatStreamProxyDto, chatStreamProxyDtoSchema, ClaudeChatProxyDto, claudeChatProxyDtoSchema } from './chat.dto'
import { ChatService } from './chat.service'
import { chatCompletionChunkVoSchema, ChatCompletionVo, ChatModelConfigVo } from './chat.vo'

@ApiTags('Me/Ai/Chat')
@Controller('ai')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiDoc({
    summary: 'Get Chat Model Parameters',
    response: [ChatModelConfigVo],
  })
  @Public()
  @Get('/models/chat')
  async getChatModels(
    @GetToken() token?: TokenInfo,
    @Query('channel') channel?: AiLogChannel,
    @Query('scene') scene?: string,
  ): Promise<ChatModelConfigVo[]> {
    const response = await this.chatService.getChatModelConfig({
      userId: token?.id,
      userType: UserType.User,
      channel,
      scene,
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

  @ApiDoc({
    summary: 'AI Chat Conversation (Stream)',
    body: chatStreamProxyDtoSchema,
    response: chatCompletionChunkVoSchema,
  })
  @SetMetadata(SSE_METADATA, true)
  @Post('/chat/stream')
  async chatStream(
    @GetToken() token: TokenInfo,
    @Body(new ZodValidationPipe(chatStreamProxyDtoSchema)) body: ChatStreamProxyDto,
  ) {
    return await this.chatService.proxyChatStream({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
  }

  @ApiDoc({
    summary: 'Claude Chat Conversation (Stream)',
    body: claudeChatProxyDtoSchema,
  })
  @SetMetadata(SSE_METADATA, true)
  @Post('/chat/claude')
  async claudeChatStream(
    @GetToken() token: TokenInfo,
    @Body(new ZodValidationPipe(claudeChatProxyDtoSchema)) body: ClaudeChatProxyDto,
  ) {
    return await this.chatService.proxyClaudeChatStream({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
  }
}
