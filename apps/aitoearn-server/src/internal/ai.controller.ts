import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AiService } from '../ai/ai.service'
import { ImageResponseVo } from '../ai/ai.vo'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../ai/core/chat'
import { AdminImageGenerationDto } from './dto/ai-image.dto'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class AIController {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) { }

  @ApiOperation({ summary: 'create publish record' })
  @Post('ai/chat/completion')
  async chatCompletion(@Body() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片生成' })
  @Post('ai/image/generate')
  async generateImage(
    @Body() body: AdminImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageGeneration(body)
    return ImageResponseVo.create(response)
  }
}
