import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { IIsAdmin } from '@yikart/stripe'
import { UnsubscribeDto } from './subscription.dto'
import { SubscriptionService } from './subscription.service'

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
  ) {
  }

  @NatsMessagePattern('payment.subscription')
  async list(@Payload() body: { userId: string, size: number, page: number }) {
    const { userId, size, page } = body
    return this.subscriptionService.list(userId, size, page)
  }

  @NatsMessagePattern('payment.unsubscribe')
  async unsubscribe(
    @Payload() body: UnsubscribeDto,
  ) {
    return this.subscriptionService.unsubscribe(body)
  }

  @NatsMessagePattern('admin.payment.subscription')
  async adminList(@Payload() body: { search: string, size: number, page: number }) {
    const { search, size, page } = body
    return this.subscriptionService.adminList(search, size, page)
  }

  @NatsMessagePattern('admin.payment.unsubscribe')
  async adminUnsubscribe(
    @Payload() body: UnsubscribeDto,
  ) {
    return this.subscriptionService.unsubscribe(body, IIsAdmin.admin)
  }
}
