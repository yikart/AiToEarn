import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { VolcengineGenerationRequestDto } from './volcengine.dto'
import { VolcengineVideoService } from './volcengine.service'
import { VolcengineTaskStatusResponseVo, VolcengineVideoGenerationResponseVo } from './volcengine.vo'

@ApiTags('Me/Ai/Video/Volcengine')
@Controller('ai/volcengine')
export class VolcengineVideoController {
  constructor(private readonly volcengineVideoService: VolcengineVideoService) {}

  @ApiDoc({
    summary: 'Generate Volcengine Video',
    body: VolcengineGenerationRequestDto.schema,
    response: VolcengineVideoGenerationResponseVo,
  })
  @Post('/video')
  async videoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VolcengineGenerationRequestDto,
  ): Promise<VolcengineVideoGenerationResponseVo> {
    const response = await this.volcengineVideoService.create({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return VolcengineVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Volcengine Video Task Status',
    response: VolcengineTaskStatusResponseVo,
  })
  @Get('/video/:taskId')
  async videoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VolcengineTaskStatusResponseVo> {
    const response = await this.volcengineVideoService.getTask(token.id, UserType.User, taskId)
    return VolcengineTaskStatusResponseVo.create(response)
  }
}
