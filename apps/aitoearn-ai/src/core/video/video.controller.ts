import { Body, Controller, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  KlingCallbackDto,
  KlingTaskQueryDto,
  KlingText2VideoRequestDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VolcengineCallbackDto,
  VolcengineGenerationRequestDto,
  VolcengineTaskQueryDto,
} from './video.dto'
import { VideoService } from './video.service'
import { KlingTaskStatusResponseVo, KlingVideoGenerationResponseVo, VideoGenerationModelParamsVo, VideoGenerationResponseVo, VideoTaskStatusResponseVo, VolcengineTaskStatusResponseVo, VolcengineVideoGenerationResponseVo } from './video.vo'

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

  @NatsMessagePattern('ai.video.generation.models')
  async getVideoGenerationModels(): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.videoService.getVideoGenerationModelParams()
    return response.map(item => VideoGenerationModelParamsVo.create(item))
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
}
