import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { RateLimit, RateLimitGuard } from '../../../../../common/guards'
import { RedNoteOfflineQrShareConfigDto } from './rednote-offline-qr.dto'
import { RedNoteOfflineQrService } from './rednote-offline-qr.service'
import { RedNoteOfflineQrShareConfigVo } from './rednote-offline-qr.vo'

@ApiTags('Channels/RedNote Offline QR')
@UseGuards(RateLimitGuard)
@Controller({ path: '/channels/rednote/offline-qr', version: '2' })
export class RedNoteOfflineQrController {
  constructor(private readonly redNoteOfflineQrService: RedNoteOfflineQrService) {}

  @ApiDoc({
    summary: '获取小红书线下打卡分享签名配置',
    description: '生成前端 xhs.share 所需 verifyConfig。',
    body: RedNoteOfflineQrShareConfigDto.schema,
    response: RedNoteOfflineQrShareConfigVo,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 60 })
  @Post('/share-config')
  async createShareConfig(@Body() body: RedNoteOfflineQrShareConfigDto) {
    return this.redNoteOfflineQrService.createShareConfig(body.nonce)
  }
}
