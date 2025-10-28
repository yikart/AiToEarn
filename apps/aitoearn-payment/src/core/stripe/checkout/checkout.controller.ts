import { Body, Controller, Post } from '@nestjs/common'
import { CheckoutBodyDto } from './checkout.dto'
import { CheckoutService } from './checkout.service'

@Controller()
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
  ) {
  }

  // 获取订单列表
  // @NatsMessagePattern('payment.list')
  @Post('payment/list')
  async list(@Body() body: { userId: string, size: number, page: number }) {
    const { userId, size, page } = body
    return this.checkoutService.list(userId, size, page)
  }

  // 获取订单
  // @NatsMessagePattern('payment.getById')
  @Post('payment/getById')
  async getById(
    @Body() body: { id: string, userId: string },
  ) {
    return this.checkoutService.getById(body.id, body.userId)
  }

  // 创建订单
  // @NatsMessagePattern('payment.create')
  @Post('payment/create')
  async create(
    @Body() body: CheckoutBodyDto,
  ) {
    return this.checkoutService.create(body)
  }

  // 获取管理员订单列表
  // @NatsMessagePattern('admin.payment.list')
  @Post('admin/payment/list')
  async adminList(@Body() body: { search: string, size: number, page: number }) {
    const { search, size, page } = body
    return this.checkoutService.adminList(search, size, page)
  }
}
