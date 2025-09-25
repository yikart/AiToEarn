import { Controller, Get, Param } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ChargeService } from './charge.service'

@Controller('charge')
export class ChargeController {
  constructor(
    private readonly chargeService: ChargeService,
  ) {
  }

  // 获取订单列表
  // @NatsMessagePattern('payment.checkout.list')
  @Get('/')
  async list(@Payload() body: { userId: string, size: number, page: number }) {
    const { userId, size, page } = body
    return this.chargeService.list(userId, size, page)
  }

  // 获取订单
  // @NatsMessagePattern('payment.checkout.getCheckoutById')
  @Get('/:id')
  async getChargeById(
    @Param('id') id: string,
  ) {
    return this.chargeService.getChargeById(id)
  }
}
