import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { OpenAIVideoCreateRequestDto, OpenAIVideoRemixRequestDto } from './openai.dto'
import { OpenAIVideoService } from './openai.service'
import { OpenAIVideoResponseVo } from './openai.vo'

@ApiTags('Me/Ai/Video/OpenAI')
@Controller('ai/openai')
export class OpenAIVideoController {
  constructor(private readonly openaiVideoService: OpenAIVideoService) {}

  @ApiDoc({
    summary: 'Create OpenAI Video',
    body: OpenAIVideoCreateRequestDto.schema,
    response: OpenAIVideoResponseVo,
  })
  @Post('/videos')
  async createVideo(
    @GetToken() token: TokenInfo,
    @Body() body: OpenAIVideoCreateRequestDto,
  ): Promise<OpenAIVideoResponseVo> {
    const response = await this.openaiVideoService.createVideo({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return OpenAIVideoResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get OpenAI Video Status',
    response: OpenAIVideoResponseVo,
  })
  @Get('/videos/:videoId')
  async getVideoStatus(
    @GetToken() token: TokenInfo,
    @Param('videoId') videoId: string,
  ): Promise<OpenAIVideoResponseVo> {
    const response = await this.openaiVideoService.getVideo(token.id, UserType.User, videoId)
    return OpenAIVideoResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Remix OpenAI Video',
    body: OpenAIVideoRemixRequestDto.schema,
    response: OpenAIVideoResponseVo,
  })
  @Post('/videos/:videoId/remix')
  async remixVideo(
    @GetToken() token: TokenInfo,
    @Param('videoId') videoId: string,
    @Body() body: OpenAIVideoRemixRequestDto,
  ): Promise<OpenAIVideoResponseVo> {
    const response = await this.openaiVideoService.remixVideo({
      ...body,
      videoId,
      userId: token.id,
      userType: UserType.User,
    })
    return OpenAIVideoResponseVo.create(response)
  }
}
