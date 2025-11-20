import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { VideoModule } from '../video'
import { VideoTaskStatusScheduler } from './video-task-status.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    VideoModule,
  ],
  providers: [VideoTaskStatusScheduler],
  exports: [],
})
export class SchedulerModule {}
