import { Global, Module } from '@nestjs/common'
import { LogsService } from './logs.service'

@Global()
@Module({
  controllers: [],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
