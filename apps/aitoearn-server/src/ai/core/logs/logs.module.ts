import { Global, Module } from '@nestjs/common'
import { LogsController } from './logs.controller'
import { LogsService } from './logs.service'

@Global()
@Module({
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
