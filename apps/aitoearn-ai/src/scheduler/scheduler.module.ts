import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [],
  exports: [],
})
export class SchedulerModule {}
