import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { UCloudModule } from '@yikart/ucloud'
import { HelpersModule } from './common/helpers/helpers.module'
import { config } from './config'
import { BrowserEnvironmentModule } from './core/browser-environment'
import { BrowserProfileModule } from './core/browser-profile'
import { CloudInstanceModule } from './core/cloud-instance'
import { MultiloginAccountModule } from './core/multilogin-account'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    UCloudModule.forRoot(config.ucloud),
    RedlockModule.forRoot(config.redlock),
    HelpersModule,
    MultiloginAccountModule,
    BrowserEnvironmentModule,
    BrowserProfileModule,
    CloudInstanceModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
