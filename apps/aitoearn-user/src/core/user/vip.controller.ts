import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { UserIdDto } from './dto/user.dto'
import { UpdateVipInfoDto } from './dto/vip.dto'
import { VipService } from './vip.service'

@Controller()
export class VipController {
  constructor(
    private readonly vipService: VipService,
  ) {}

  @NatsMessagePattern('user.vip.set')
  async setVipInfo(@Payload() data: UpdateVipInfoDto) {
    return await this.vipService.setVipInfo(data.id, data.cycleType)
  }

  @NatsMessagePattern('user.vip.closeVipAutoContinue')
  async closeVipAutoContinue(@Payload() data: UserIdDto) {
    return await this.vipService.closeVipAutoContinue(data.id)
  }

  @NatsMessagePattern('user.vip.findAllNormelVipUsers')
  async findAllNormelVipUsers() {
    return await this.vipService.findAllNormelVipUsers()
  }

  @NatsMessagePattern('user.admin.vip.addAllPoints')
  async dispatchVipIntegral() {
    const userList = await this.vipService.findAllNormelVipUsers()
    for (const user of userList) {
      await this.vipService.addVipPoints(user)
    }
  }
}
