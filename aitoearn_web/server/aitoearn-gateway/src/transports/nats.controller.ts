import { Controller, Get } from '@nestjs/common'
import { NatsService } from './nats.service'

@Controller('nats')
export class NatsController {
  constructor(private readonly natsService: NatsService) {}

  @Get('test')
  testNats() {
    this.natsService.publishEvent('test_event', {
      message: 'Hello NATS',
    })
    const response = this.natsService.sendMessage('test_message', {
      message: 'Ping',
    })
    return { response }
  }
}
