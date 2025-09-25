import { IIsAdmin } from '@libs/stripe/checkout/comment'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
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
