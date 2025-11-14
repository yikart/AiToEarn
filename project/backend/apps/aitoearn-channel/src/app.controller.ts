import { Body, Controller, Get, Logger, Post } from '@nestjs/common'
import { Ctx, NatsContext } from '@nestjs/microservices'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AppService } from './app.service'

@ApiTags('OpenSource/App/App')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)

  constructor(private readonly appService: AppService) {}

  @ApiDoc({
    summary: 'Get System Info',
  })
  @Get()
  getSysInfo() {
    return {
      // ip:
    }
  }

  // @NatsMessagePattern('chanel.ping')
  @ApiDoc({
    summary: 'Ping Channel Service',
  })
  @Post('chanel/ping')
  pong(@Body() data: number[], @Ctx() context: NatsContext) {
    this.logger.debug(`Subject: ${context.getSubject()}`)
    this.logger.debug(`Data:`, data)
    return {
      message: 'Pong',
    }
  }
}
