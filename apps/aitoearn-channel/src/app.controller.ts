import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { Ctx, NatsContext } from '@nestjs/microservices'
import { AppService } from './app.service'

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)

  constructor(private readonly appService: AppService) {}

  @Get()
  getSysInfo() {
    return {
      // ip:
    }
  }

  // @NatsMessagePattern('chanel.ping')
  @Post('chanel/ping')
  pong(@Body() data: number[], @Ctx() context: NatsContext) {
    this.logger.debug(`Subject: ${context.getSubject()}`)
    this.logger.debug(`Data:`, data)
    return {
      message: 'Pong',
    }
  }
}
