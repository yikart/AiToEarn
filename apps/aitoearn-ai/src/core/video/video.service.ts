import path from 'node:path'
import { VideoService as NewApiVideoService } from '@libs/new-api'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { VideoGenerationRequestDto, VideoTaskQueryDto } from './video.dto'

@Injectable()
export class VideoService {
  constructor(
    private readonly videoService: NewApiVideoService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration(request: VideoGenerationRequestDto) {
    const result = await this.videoService.submitVideoGeneration({
      apiKey: config.newApi.apiKey,
      ...request,
    })

    return result
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: VideoTaskQueryDto) {
    const { taskId } = request

    const result = await this.videoService.getVideoTaskStatus({
      apiKey: config.newApi.apiKey,
      taskId,
    })

    if (result.fail_reason && result.fail_reason.startsWith('http')) {
      const filename = `${taskId}-${path.basename(result.fail_reason.split('?')[0])}`
      const { key } = await this.s3Service.uploadFileByUrl(`ai/videos/${filename}`, result.fail_reason)
      result.fail_reason = key
    }
    return result
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams() {
    return config.ai.models.video.generation
  }
}
