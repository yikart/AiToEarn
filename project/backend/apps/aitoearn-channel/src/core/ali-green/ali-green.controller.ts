import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AliGreenService } from './ali-green.service'

@ApiTags('OpenSource/Core/AliGreen/AliGreen')
@Controller()
export class AliGreenController {
  constructor(
    private readonly aliGreenService: AliGreenService,
  ) {}

  // 文本审核  限制在2000字以内
  // @NatsMessagePattern('aliGreen.textGreen')
  @ApiDoc({
    summary: 'Moderate Text Content',
  })
  @Post('aliGreen/textGreen')
  textGreen(@Body() data: { content: string }) {
    return this.aliGreenService.textGreen(data.content)
  }

  // 图片审核  限制频率 qps为100  每张图片大小限制为20M以内
  // @NatsMessagePattern('aliGreen.imgGreen')
  @ApiDoc({
    summary: 'Moderate Image Content',
  })
  @Post('aliGreen/imgGreen')
  imgGreen(@Body() data: { imageUrl: string }) {
    return this.aliGreenService.imgGreen(data.imageUrl)
  }

  // 视频审核  限制视频大小 为500M以内  格式为mp4 flv
  // @NatsMessagePattern('aliGreen.videoGreen')
  @ApiDoc({
    summary: 'Moderate Video Content',
  })
  @Post('aliGreen/videoGreen')
  videoGreen(@Body() data: { url: string }) {
    return this.aliGreenService.videoGreen(data.url)
  }

  // @NatsMessagePattern('aliGreen.getVideoResult')
  @ApiDoc({
    summary: 'Get Video Moderation Result',
  })
  @Post('aliGreen/getVideoResult')
  getVideoResult(@Body() data: { taskId: string }) {
    return this.aliGreenService.getVideoResult(data.taskId)
  }
}
