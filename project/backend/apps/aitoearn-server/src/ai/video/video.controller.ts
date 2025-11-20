import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import {
  DashscopeImage2VideoRequestDto,
  DashscopeKeyFrame2VideoRequestDto,
  DashscopeText2VideoRequestDto,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingText2VideoRequestDto,
  UserListVideoTasksQueryDto,
  VideoGenerationRequestDto,
  VolcengineGenerationRequestDto,
} from './video.dto'
import { VideoService } from './video.service'
import {
  DashscopeTaskStatusResponseVo,
  DashscopeVideoGenerationResponseVo,
  KlingTaskStatusResponseVo,
  KlingVideoGenerationResponseVo,
  ListVideoTasksResponseVo,
  VideoGenerationModelParamsVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
  VolcengineTaskStatusResponseVo,
  VolcengineVideoGenerationResponseVo,
} from './video.vo'

@ApiTags('OpenSource/Me/Ai')
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

  // 通用视频接口
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
    query: UserListVideoTasksQueryDto.schema,
    response: ListVideoTasksResponseVo,
  })
  @Get('/video/generations')
  async listVideoTasks(
    @GetToken() token: TokenInfo,
    @Query() query: UserListVideoTasksQueryDto,
  ): Promise<ListVideoTasksResponseVo> {
    const [list, total] = await this.videoService.listVideoTasks({
      ...query,
      userId: token.id,
      userType: UserType.User,
    })
    return new ListVideoTasksResponseVo(list, total, query)
  }

  // Volcengine 视频接口
  @ApiDoc({
    summary: 'Generate Volcengine Video',
    body: VolcengineGenerationRequestDto.schema,
    response: VolcengineVideoGenerationResponseVo,
  })
  @Post('/volcengine/video')
  async volcVideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VolcengineGenerationRequestDto,
  ): Promise<VolcengineVideoGenerationResponseVo> {
    const response = await this.videoService.volcengineCreate({
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
  @Get('/volcengine/video/:taskId')
  async volcVideoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VolcengineTaskStatusResponseVo> {
    const response = await this.videoService.getVolcengineTask(token.id, UserType.User, taskId)
    return VolcengineTaskStatusResponseVo.create(response)
  }

  // Kling 视频接口
  @ApiDoc({
    summary: 'Generate Kling Video from Text',
    body: KlingText2VideoRequestDto.schema,
    response: KlingVideoGenerationResponseVo,
  })
  @Post('/kling/text2video')
  async klingVideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingText2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingText2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    } as KlingText2VideoRequestDto & { userId: string, userType: UserType })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Kling Video from Image',
    body: KlingImage2VideoRequestDto.schema,
    response: KlingVideoGenerationResponseVo,
  })
  @Post('/kling/image2video')
  async klingImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingImage2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingImage2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Kling Video from Multiple Images',
    body: KlingMultiImage2VideoRequestDto.schema,
    response: KlingVideoGenerationResponseVo,
  })
  @Post('/kling/multi-image2video')
  async klingMultiImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingMultiImage2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingMultiImage2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Kling Task Status',
    response: KlingTaskStatusResponseVo,
  })
  @Get('/kling/:taskId')
  async getKlingTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<KlingTaskStatusResponseVo> {
    const response = await this.videoService.getKlingTask(token.id, UserType.User, taskId)
    return KlingTaskStatusResponseVo.create(response)
  }

  // Dashscope 视频接口
  @ApiDoc({
    summary: 'Generate Dashscope Video from Text',
    body: DashscopeText2VideoRequestDto.schema,
    response: DashscopeVideoGenerationResponseVo,
  })
  @Post('/dashscope/text2video')
  async dashscopeText2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeText2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeText2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Dashscope Video from Image',
    body: DashscopeImage2VideoRequestDto.schema,
    response: DashscopeVideoGenerationResponseVo,
  })
  @Post('/dashscope/image2video')
  async dashscopeImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeImage2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeImage2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Dashscope Video from Key Frames',
    body: DashscopeKeyFrame2VideoRequestDto.schema,
    response: DashscopeVideoGenerationResponseVo,
  })
  @Post('/dashscope/keyframe2video')
  async dashscopeKeyFrame2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeKeyFrame2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeKeyFrame2Video({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Dashscope Task Status',
    response: DashscopeTaskStatusResponseVo,
  })
  @Get('/dashscope/:taskId')
  async getDashscopeTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<DashscopeTaskStatusResponseVo> {
    const response = await this.videoService.getDashscopeTask(token.id, UserType.User, taskId)
    return DashscopeTaskStatusResponseVo.create(response)
  }
}
