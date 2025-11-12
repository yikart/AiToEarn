import { Body, Controller, Post } from '@nestjs/common'
import { AliGreenService } from './ali-green.service'

@Controller()
export class AliGreenController {
  constructor(
    private readonly aliGreenService: AliGreenService,
  ) {}

  // 文本审核  限制在2000字以内
  // @NatsMessagePattern('aliGreen.textGreen')
  @Post('aliGreen/textGreen')
  textGreen(@Body() data: { content: string }) {
    return this.aliGreenService.textGreen(data.content)
  }

  // 图片审核  限制频率 qps为100  每张图片大小限制为20M以内
  // @NatsMessagePattern('aliGreen.imgGreen')
  @Post('aliGreen/imgGreen')
  imgGreen(@Body() data: { imageUrl: string }) {
    return this.aliGreenService.imgGreen(data.imageUrl)
  }

  // 视频审核  限制视频大小 为500M以内  格式为mp4 flv
  // @NatsMessagePattern('aliGreen.videoGreen')
  @Post('aliGreen/videoGreen')
  videoGreen(@Body() data: { url: string }) {
    return this.aliGreenService.videoGreen(data.url)
  }

  // @NatsMessagePattern('aliGreen.getVideoResult')
  @Post('aliGreen/getVideoResult')
  getVideoResult(@Body() data: { taskId: string }) {
    return this.aliGreenService.getVideoResult(data.taskId)
  }
}
