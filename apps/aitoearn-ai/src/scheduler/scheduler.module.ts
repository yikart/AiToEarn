import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { MongodbModule } from '@yikart/mongodb'
import { VideoTaskStatusScheduler } from './video-task-status.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongodbModule,
  ],
  providers: [VideoTaskStatusScheduler],
  exports: [],
})
export class SchedulerModule {}
