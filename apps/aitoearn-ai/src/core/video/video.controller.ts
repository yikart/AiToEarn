import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { VideoGenerationRequestDto, VideoTaskQueryDto } from './video.dto'
import { VideoService } from './video.service'
import { VideoGenerationModelParamsVo, VideoGenerationResponseVo, VideoTaskStatusResponseVo } from './video.vo'

@Controller()
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
  ) {}

  @NatsMessagePattern('ai.video.generations')
  async userVideoGeneration(@Payload() data: VideoGenerationRequestDto): Promise<VideoGenerationResponseVo> {
    const response = await this.videoService.userVideoGeneration(data)
    return VideoGenerationResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.task.query')
  async getVideoTaskStatus(@Payload() data: VideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.videoService.getVideoTaskStatus(data)
    return VideoTaskStatusResponseVo.create(response)
  }

  @NatsMessagePattern('ai.video.generation.models')
  async getVideoGenerationModels(): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.videoService.getVideoGenerationModelParams()
    return response.map(item => VideoGenerationModelParamsVo.create(item))
  }
}
