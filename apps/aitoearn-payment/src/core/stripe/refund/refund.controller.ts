import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { IIsAdmin } from '@yikart/stripe'
import { RefundBodyDto } from './refund.dto'
import { RefundService } from './refund.service'

@Controller('refund')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
  ) {}

  // 退款订单
  @NatsMessagePattern('admin.payment.refund')
  async create(
    @Payload() body: RefundBodyDto,
  ) {
    return this.refundService.create(body, IIsAdmin.client)
  }
}
