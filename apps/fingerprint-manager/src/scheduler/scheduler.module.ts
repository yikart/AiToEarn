import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { CloudInstanceModule } from '../core/cloud-instance'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { EnvironmentConfigScheduler } from './environment-config.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CloudInstanceModule,
    MultiloginAccountModule,
  ],
  providers: [EnvironmentConfigScheduler],
  exports: [EnvironmentConfigScheduler],
})
export class SchedulerModule {}
