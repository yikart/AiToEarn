import { Controller } from '@nestjs/common'
// import { Cron } from '@nestjs/schedule'
// import { RedisService } from '@yikart/redis'
// import { VipService } from './vip.service'

// const VipAddPointsLockKey = 'vip:add:points:lock:'

@Controller()
export class VipController {
  constructor(
    // private readonly vipService: VipService,
    // private readonly redisService: RedisService,
  ) {}

  // @Cron('0 30 0 * * *')
  // async dispatchVipIntegral() {
  //   const theKeyHad = await this.redisService.get(VipAddPointsLockKey)

  //   if (theKeyHad)
  //     return

  //   this.redisService.set(VipAddPointsLockKey, '1', 60 * 60 * 24)
  //   const userList = await this.vipService.findAllNormelVipUsers()

  //   userList.forEach(async (user) => {
  //     this.vipService.addVipPoints(user)
  //   })
  // }
}
