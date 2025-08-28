import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { UCloudModule } from '@yikart/ucloud'
import { HelpersModule } from './common/helpers/helpers.module'
import { config } from './config'
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
    HelpersModule,
    MultiloginAccountModule,
    CloudSpaceModule,
    BrowserProfileModule,
    CloudInstanceModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
