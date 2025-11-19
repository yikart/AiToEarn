import { Controller, OnModuleInit } from '@nestjs/common'
// import { Cron } from '@nestjs/schedule'
// import { RedisService } from '@yikart/redis'
// import { VipService } from './vip.service'

// const VipAddPointsLockKey = 'vip:add:points:lock:'
import { TemplatesService, TransactionalService } from '@yikart/listmonk'

@Controller()
export class VipController implements OnModuleInit {
  constructor(
    // private readonly vipService: VipService,
    // private readonly redisService: RedisService,
    private readonly transactionalService: TransactionalService,
    private readonly templatesService: TemplatesService,
  ) {}

  onModuleInit() {
    // this.testListmonk()
    // this.test2()
  }
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

  testListmonk() {
    return this.transactionalService.sendTransactionalMessage({
      template_id: 2,
      subscriber_email: '861796052@qq.com',
      subject: 'Test',
      data: {
        name: 'Nevin',
        content: '<p>Test</p>',
      },
      content_type: 'html',
    })
  }

  async test2() {
    const res = await this.templatesService.retrieveAllTemplates()
    return res
  }
}
