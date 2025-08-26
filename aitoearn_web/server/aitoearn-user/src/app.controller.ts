import { NatsMessagePattern } from '@common/decorators'
import { Controller, Get, Logger } from '@nestjs/common'
import { Ctx, NatsContext, Payload } from '@nestjs/microservices'
import { AppService } from './app.service'
import { AppException } from './common'

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)

  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @NatsMessagePattern('user.ping')
  pong(@Payload() data: number[], @Ctx() context: NatsContext) {
    console.log('------------')
    throw new AppException(10001, '1111')

    return {
      message: 'Pong',
    }
  }
}
