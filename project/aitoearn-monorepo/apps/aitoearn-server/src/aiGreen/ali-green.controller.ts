import { Controller, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AliGreenService } from './ali-green.service'
import { ImageBodyDto, TextBodyDto, VideoBodyDto, VideoResultBodyDto } from './dto/ali-green.dto'

@Controller('aliGreen')
export class AliGreenController {
  constructor(
    private readonly aliGreenService: AliGreenService,
  ) {}

  // 文本审核  限制在2000字以内
  @Post('textGreen/')
  textGreen(@GetToken() token: TokenInfo, @Payload() data: TextBodyDto) {
    return this.aliGreenService.textGreen(data, token)
  }

  // 图片审核  限制频率 qps为100  每张图片大小限制为20M以内
  @Post('imgGreen/')
  imgGreen(@GetToken() token: TokenInfo, @Payload() data: ImageBodyDto) {
    return this.aliGreenService.imgGreen(data, token)
  }

  // 视频审核  限制视频大小 为500M以内  格式为mp4 flv
  @Post('videoGreen/')
  videoGreen(@GetToken() token: TokenInfo, @Payload() data: VideoBodyDto) {
    return this.aliGreenService.videoGreen(data, token)
  }

  @Post('getVideoResult/')
  getVideoResult(@GetToken() token: TokenInfo, @Payload() data: VideoResultBodyDto) {
    return this.aliGreenService.getVideoResult(data, token)
  }
}
