import { Body, Controller, Post } from '@nestjs/common'
import { IIsAdmin } from '@yikart/stripe'
import { RefundBodyDto } from './refund.dto'
import { RefundService } from './refund.service'

@Controller('refund')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
  ) {}

  // 退款订单
  // @NatsMessagePattern('admin.payment.refund')
  @Post('admin/payment/refund')
  async create(
    @Body() body: RefundBodyDto,
  ) {
    return this.refundService.create(body, IIsAdmin.client)
  }
}
