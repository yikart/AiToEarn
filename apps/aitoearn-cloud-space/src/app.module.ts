import { Module } from '@nestjs/common'
import { AitoearnUserClientModule } from '@yikart/aitoearn-user-client'
import { AnsibleModule } from '@yikart/ansible'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { UCloudModule } from '@yikart/ucloud'
import { HelpersModule } from './common/helpers/helpers.module'
import { config } from './config'
import { ConsumersModule } from './consumers/consumers.module'
import { BrowserProfileModule } from './core/browser-profile'
import { CloudInstanceModule } from './core/cloud-instance'
import { CloudSpaceModule } from './core/cloud-space'
import { MultiloginAccountModule } from './core/multilogin-account'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    UCloudModule.forRoot(config.ucloud),
    RedlockModule.forRoot(config.redlock),
    AitoearnUserClientModule.forRoot(config.nats),
    AnsibleModule.forRoot(config.ansible),
    HelpersModule,
    MultiloginAccountModule,
    CloudSpaceModule,
    BrowserProfileModule,
    CloudInstanceModule,
    SchedulerModule,
    ConsumersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
