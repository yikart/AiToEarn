import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common/decorators'
import { CheckoutBodyDto } from './checkout.dto'
import { CheckoutService } from './checkout.service'

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
  ) {
  }

  // 获取订单列表
  @NatsMessagePattern('payment.list')
  async list(@Payload() body: { userId: string, size: number, page: number }) {
    const { userId, size, page } = body
    return this.checkoutService.list(userId, size, page)
  }

  // 获取订单
  @NatsMessagePattern('payment.getById')
  async getById(
      @Payload() body: { id: string, userId: string },
  ) {
    return this.checkoutService.getById(body.id, body.userId)
  }

  // 创建订单
  @NatsMessagePattern('payment.create')
  async create(
    @Payload() body: CheckoutBodyDto,
  ) {
    return this.checkoutService.create(body)
  }

  // 获取管理员订单列表
  @NatsMessagePattern('admin.payment.list')
  async adminList(@Payload() body: { search: string, size: number, page: number }) {
    const { search, size, page } = body
    return this.checkoutService.adminList(search, size, page)
  }
}
