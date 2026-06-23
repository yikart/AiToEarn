import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { RateLimit, RateLimitGuard } from '../../../../../common/guards'
import { CreateDouyinOfflineQrPublishDto } from './douyin-offline-qr.dto'
import { DouyinOfflineQrService } from './douyin-offline-qr.service'
import { DouyinOfflineQrPublishVo } from './douyin-offline-qr.vo'

@ApiTags('Channels/Douyin Offline QR')
@UseGuards(RateLimitGuard)
@Controller({ path: '/channels/douyin/offline-qr', version: '2' })
export class DouyinOfflineQrController {
  constructor(private readonly douyinOfflineQrService: DouyinOfflineQrService) {}

  @ApiDoc({
    summary: '创建抖音线下打卡发布记录',
    description: '匿名创建抖音线下打卡发布记录，并返回抖音 App scheme 和短链接。',
    body: CreateDouyinOfflineQrPublishDto.schema,
    response: DouyinOfflineQrPublishVo,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 30 })
  @Post('/publish')
  async createPublish(@Body() body: CreateDouyinOfflineQrPublishDto) {
    return this.douyinOfflineQrService.createPublish(body)
  }
}
