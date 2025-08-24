import { AnsibleModule } from '@aitoearn/ansible'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { config } from '../config'
import { CloudInstanceModule } from '../core/cloud-instance'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { EnvironmentConfigScheduler } from './environment-config.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CloudInstanceModule,
    MultiloginAccountModule,
    AnsibleModule.forRoot(config.ansible),
  ],
  providers: [EnvironmentConfigScheduler],
  exports: [EnvironmentConfigScheduler],
})
export class SchedulerModule {}
