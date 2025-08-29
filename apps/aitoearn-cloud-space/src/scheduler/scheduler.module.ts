import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { QueueName } from '../common/enums'
import { CloudInstanceModule } from '../core/cloud-instance'
import { CloudSpaceSetupScheduler } from './cloud-space-setup.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: QueueName.CloudspaceConfigure,
    }),
    CloudInstanceModule,
  ],
  providers: [CloudSpaceSetupScheduler],
  exports: [],
})
export class SchedulerModule {}
