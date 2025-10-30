import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { QueueName } from '../common/enums'
import { BrowserProfileModule } from '../core/browser-profile'
import { CloudInstanceModule } from '../core/cloud-instance'
import { CloudSpaceModule } from '../core/cloud-space'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { CloudSpaceConfigConsumer } from './cloud-space-config.consumer'
import { CloudSpaceExpirationConsumer } from './cloud-space-expiration.consumer'

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.CloudspaceConfigure,
    }),
    BullModule.registerQueue({
      name: QueueName.CloudspaceExpiration,
    }),
    BrowserProfileModule,
    CloudInstanceModule,
    CloudSpaceModule,
    MultiloginAccountModule,
  ],
  providers: [CloudSpaceConfigConsumer, CloudSpaceExpirationConsumer],
  exports: [],
})
export class ConsumersModule {}
