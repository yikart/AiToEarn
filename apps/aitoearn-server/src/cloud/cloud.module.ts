import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { AnsibleModule } from '@yikart/ansible'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { UCloudModule } from '@yikart/ucloud'
import { config } from '../config'
import { HelpersModule } from './common/helpers/helpers.module'
import { ConsumersModule } from './consumers/consumers.module'
import { BrowserProfileModule } from './core/browser-profile'
import { CloudInstanceModule } from './core/cloud-instance'
import { CloudSpaceModule } from './core/cloud-space'
import { MultiloginAccountModule } from './core/multilogin-account'
import { SchedulerModule } from './scheduler'

@Global()
@Module({
  imports: [
    HttpModule,
    MongodbModule.forRoot(config.mongodb),
    UCloudModule.forRoot(config.ucloud),
    RedlockModule.forRoot(config.redlock),
    AnsibleModule.forRoot(config.ansible),
    BullModule.forRoot({
      connection: config.redis,
    }),
    HelpersModule,
    MultiloginAccountModule,
    CloudSpaceModule,
    BrowserProfileModule,
    CloudInstanceModule,
    SchedulerModule,
    ConsumersModule,
  ],
})
export class CloudModule { }
