import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AnsibleModule } from '@yikart/ansible'
import { config } from '../config'
import { CloudInstanceModule } from '../core/cloud-instance'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { CloudSpaceSetupScheduler } from './cloud-space-setup.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CloudInstanceModule,
    MultiloginAccountModule,
    AnsibleModule.forRoot(config.ansible),
  ],
  providers: [CloudSpaceSetupScheduler],
  exports: [],
})
export class SchedulerModule {}
