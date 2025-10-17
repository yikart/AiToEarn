import { Body, Controller, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  DashscopeCallbackDto,
  DashscopeImage2VideoRequestDto,
  DashscopeKeyFrame2VideoRequestDto,
  DashscopeTaskQueryDto,
  DashscopeText2VideoRequestDto,
  KlingCallbackDto,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingTaskQueryDto,
  KlingText2VideoRequestDto,
  UserListVideoTasksQueryDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VideoGenerationModelsQueryDto,
  VolcengineCallbackDto,
  VolcengineGenerationRequestDto,
  VolcengineTaskQueryDto,
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

@Controller('/video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
  ) {}

  @NatsMessagePattern('ai.video.generations')
  async userVideoGeneration(@Payload() data: UserVideoGenerationRequestDto): Promise<VideoGenerationResponseVo> {
    const response = await this.videoService.userVideoGeneration(data)
    return VideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.task.query')
  async getVideoTaskStatus(@Payload() data: UserVideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.videoService.getVideoTaskStatus(data)
    return VideoTaskStatusResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.task.list')
  async listVideoTasks(@Payload() data: UserListVideoTasksQueryDto): Promise<ListVideoTasksResponseVo> {
    const [list, total] = await this.videoService.listVideoTasks(data)
    return new ListVideoTasksResponseVo(list, total, data)
  }

  @NatsMessagePattern('ai.video.generation.models')
  async getVideoGenerationModels(@Payload() data: VideoGenerationModelsQueryDto): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.videoService.getVideoGenerationModelParams(data)
    return response.map((item: VideoGenerationModelParamsVo) => VideoGenerationModelParamsVo.create(item))
  }

  @NatsMessagePattern('ai.video.kling.text2video')
  async klingText2Video(@Payload() data: KlingText2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingText2Video(data)
    return KlingVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.kling.task.query')
  async getKlingTaskStatus(@Payload() data: KlingTaskQueryDto): Promise<KlingTaskStatusResponseVo> {
    const response = await this.videoService.getKlingTask(data.userId, data.userType, data.taskId)
    return KlingTaskStatusResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.volcengine.generation')
  async volcengineCreate(@Payload() data: VolcengineGenerationRequestDto): Promise<VolcengineVideoGenerationResponseVo> {
    const response = await this.videoService.volcengineCreate(data)
    return VolcengineVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.volcengine.task.query')
  async getVolcengineTaskStatus(@Payload() data: VolcengineTaskQueryDto): Promise<VolcengineTaskStatusResponseVo> {
    const response = await this.videoService.getVolcengineTask(data.userId, data.userType, data.taskId)
    return VolcengineTaskStatusResponseVo.create(response)
  }

  @Post('/kling/callback')
  async klingCallback(@Body() data: KlingCallbackDto) {
    await this.videoService.klingCallback(data)
  }

  @Post('/volcengine/callback')
  async volcengineCallback(@Body() data: VolcengineCallbackDto) {
    await this.videoService.volcengineCallback(data)
  }

  // ==================== Kling API 其他接口 ====================

  @NatsMessagePattern('ai.video.kling.image2video')
  async klingImage2Video(@Payload() request: KlingImage2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.kling.multi-image2video')
  async klingMultiImage2Video(@Payload() request: KlingMultiImage2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.videoService.klingMultiImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  // ==================== Dashscope API 接口 ====================

  @NatsMessagePattern('ai.video.dashscope.text2video')
  async dashscopeText2Video(@Payload() request: DashscopeText2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeText2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.dashscope.image2video')
  async dashscopeImage2Video(@Payload() request: DashscopeImage2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeImage2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.dashscope.keyframe2video')
  async dashscopeKeyFrame2Video(@Payload() request: DashscopeKeyFrame2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.videoService.dashscopeKeyFrame2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.dashscope.task.query')
  async getDashscopeTaskStatus(@Payload() data: DashscopeTaskQueryDto): Promise<DashscopeTaskStatusResponseVo> {
    const response = await this.videoService.getDashscopeTask(data.userId, data.userType, data.taskId)
    return DashscopeTaskStatusResponseVo.create(response)
  }

  @Post('/dashscope/callback')
  async dashscopeCallback(@Body() data: DashscopeCallbackDto) {
    await this.videoService.dashscopeCallback(data)
  }
}
