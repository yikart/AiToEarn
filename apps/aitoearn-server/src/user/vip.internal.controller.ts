import { Body, Controller, Post } from '@nestjs/common'
import { Internal } from '@yikart/aitoearn-auth'
import { VipStatus } from '@yikart/mongodb'
import { VipService } from './vip.service'

@Controller()
@Internal()
export class VipInternalController {
  constructor(
    private readonly vipService: VipService,
  ) { }

  @Post('vipInternal/set')
  async setVip(@Body() body: {
    userId: string
    status: VipStatus
  }) {
    const res = await this.vipService.setVipInfo(body.userId, body.status)
    return res
  }
}
