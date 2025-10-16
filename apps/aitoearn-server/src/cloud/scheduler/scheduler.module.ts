import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { QueueName } from '../common/enums'
import { CloudInstanceModule } from '../core/cloud-instance'
import { CloudSpaceModule } from '../core/cloud-space'
import { CloudSpaceExpirationScheduler } from './cloud-space-expiration.scheduler'
import { CloudSpaceSetupScheduler } from './cloud-space-setup.scheduler'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: QueueName.CloudspaceConfigure,
    }),
    BullModule.registerQueue({
      name: QueueName.CloudspaceExpiration,
    }),
    CloudInstanceModule,
    CloudSpaceModule,
  ],
  providers: [CloudSpaceSetupScheduler, CloudSpaceExpirationScheduler],
  exports: [],
})
export class SchedulerModule {}
