import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { ListVideoTasksQueryDto, VideoGenerationRequestDto } from './video.dto'
import { VideoService } from './video.service'
import {
  ListVideoTasksResponseVo,
  VideoGenerationModelParamsVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
} from './video.vo'

@ApiTags('Me/Ai/Video')
@Controller('ai')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @ApiDoc({
    summary: 'Get Video Generation Model Parameters',
    response: [VideoGenerationModelParamsVo],
  })
  @Public()
  @Get('/models/video/generation')
  async getVideoGenerationModels(@GetToken() token?: TokenInfo): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.videoService.getVideoGenerationModelParams({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map(item => VideoGenerationModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Generate Video',
    body: VideoGenerationRequestDto.schema,
    response: VideoGenerationResponseVo,
  })
  @Post('/video/generations')
  async videoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.videoService.userVideoGeneration({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return VideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Video Task Status',
    response: VideoTaskStatusResponseVo,
  })
  @Get('/video/generations/:taskId')
  async getVideoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VideoTaskStatusResponseVo> {
    const response = await this.videoService.getVideoTaskStatus({
      userId: token.id,
      userType: UserType.User,
      taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'List Video Tasks',
    query: ListVideoTasksQueryDto.schema,
    response: ListVideoTasksResponseVo,
  })
  @Get('/video/generations')
  async listVideoTasks(
    @GetToken() token: TokenInfo,
    @Query() query: ListVideoTasksQueryDto,
  ): Promise<ListVideoTasksResponseVo> {
    const [list, total] = await this.videoService.listVideoTasks({
      ...query,
      userId: token.id,
      userType: UserType.User,
    })
    return new ListVideoTasksResponseVo(list, total, query)
  }
}
