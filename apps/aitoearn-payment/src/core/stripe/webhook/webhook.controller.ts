import { WebhookDto } from '@core/stripe/webhook/dto/webhook.dto'
import { Controller, Logger, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common/decorators'
import { WebhookService } from './webhook.service'

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)
  constructor(
    private readonly webhookService: WebhookService,
  ) {
  }

  // 接收回调
  @NatsMessagePattern('payment.webhook')
  @Post('')
  async webhook(
    @Payload() body: WebhookDto,
  ) {
    const data = await this.webhookService.webhook(body)
    this.logger.debug(data)
    return data
  }
}
