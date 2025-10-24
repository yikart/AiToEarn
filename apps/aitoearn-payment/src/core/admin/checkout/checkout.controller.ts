import { Body, Controller, Post } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AdminCheckoutService } from './checkout.service'

@Controller()
export class AdminCheckoutController {
  constructor(private readonly checkoutService: AdminCheckoutService) {}

  // 获取订单列表
  // @NatsMessagePattern('payment.admin.checkout.list')
  @Post('payment/admin/checkout/list')
  async list(@Body() data: TableDto) {
    return this.checkoutService.list(data)
  }
}
