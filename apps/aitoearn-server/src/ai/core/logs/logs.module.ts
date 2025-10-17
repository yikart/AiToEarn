import { Module } from '@nestjs/common'
import { LogsController } from './logs.controller'
import { LogsService } from './logs.service'

@Module({
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
