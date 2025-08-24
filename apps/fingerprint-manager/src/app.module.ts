import { MongodbModule } from '@aitoearn/mongodb'
import { RedlockModule } from '@aitoearn/redlock'
import { UCloudModule } from '@aitoearn/ucloud'
import { Module } from '@nestjs/common'
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
