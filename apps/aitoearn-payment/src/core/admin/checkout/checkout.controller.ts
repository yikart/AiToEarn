import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern, TableDto } from '@yikart/common'
import { AdminCheckoutService } from './checkout.service'

@Controller()
export class AdminCheckoutController {
  constructor(private readonly checkoutService: AdminCheckoutService) {}

  // 获取订单列表
  @NatsMessagePattern('payment.admin.checkout.list')
  async list(@Payload() data: TableDto) {
    return this.checkoutService.list(data)
  }
}
