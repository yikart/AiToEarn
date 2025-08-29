import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { AnsibleModule } from '@yikart/ansible'
import { MongodbModule } from '@yikart/mongodb'
import { QueueName } from '../common/enums/queue.enum'
import { BrowserProfileModule } from '../core/browser-profile'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { CloudSpaceConfigConsumer } from './cloud-space-config.consumer'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: QueueName.CloudspaceConfigure,
    }),
    MongodbModule,
    AnsibleModule,
    BrowserProfileModule,
    MultiloginAccountModule,
  ],
  providers: [CloudSpaceConfigConsumer],
  exports: [CloudSpaceConfigConsumer],
})
export class ConsumersModule {}
