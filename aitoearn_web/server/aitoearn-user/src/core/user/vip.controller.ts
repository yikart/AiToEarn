import { NatsMessagePattern } from '@common/decorators'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { UpdateVipInfoDto } from './dto/vip.dto'
import { VipService } from './vip.service'

@Controller()
export class VipController {
  constructor(private readonly vipService: VipService) { }

  @NatsMessagePattern('user.vip.set')
  setVipInfo(@Payload() data: UpdateVipInfoDto) {
    return this.vipService.setVipInfo(data.id, data.cycleType)
  }
}
