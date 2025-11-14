import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AliGreenService } from './ali-green.service'
import { ImageBodyDto, TextBodyDto, VideoBodyDto, VideoResultBodyDto } from './dto/ali-green.dto'

@ApiTags('OpenSource/AiGreen/AliGreen')
@Controller('aliGreen')
export class AliGreenController {
  constructor(
    private readonly aliGreenService: AliGreenService,
  ) {}

  // 文本审核  限制在2000字以内
  @ApiDoc({
    summary: 'Moderate Text Content',
    body: TextBodyDto.schema,
  })
  @Post('textGreen/')
  textGreen(@GetToken() token: TokenInfo, @Body() data: TextBodyDto) {
    return this.aliGreenService.textGreen(data, token)
  }

  // 图片审核  限制频率 qps为100  每张图片大小限制为20M以内
  @ApiDoc({
    summary: 'Moderate Image Content',
    body: ImageBodyDto.schema,
  })
  @Post('imgGreen/')
  imgGreen(@GetToken() token: TokenInfo, @Body() data: ImageBodyDto) {
    return this.aliGreenService.imgGreen(data, token)
  }

  // 视频审核  限制视频大小 为500M以内  格式为mp4 flv
  @ApiDoc({
    summary: 'Moderate Video Content',
    body: VideoBodyDto.schema,
  })
  @Post('videoGreen/')
  videoGreen(@GetToken() token: TokenInfo, @Body() data: VideoBodyDto) {
    return this.aliGreenService.videoGreen(data, token)
  }

  @ApiDoc({
    summary: 'Get Video Moderation Result',
    body: VideoResultBodyDto.schema,
  })
  @Post('getVideoResult/')
  getVideoResult(@GetToken() token: TokenInfo, @Body() data: VideoResultBodyDto) {
    return this.aliGreenService.getVideoResult(data, token)
  }
}
