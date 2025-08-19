import { MongodbModule } from '@aitoearn/mongodb'
import { UCloudModule } from '@aitoearn/ucloud'
import { Module } from '@nestjs/common'
import { config } from './config'
import { BrowserEnvironmentModule } from './core/browser-environment'
import { BrowserProfileModule } from './core/browser-profile'
import { CloudInstanceModule } from './core/cloud-instance'
import { MultiloginAccountModule } from './core/multilogin-account'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    UCloudModule.forRoot(config.ucloud),
    MultiloginAccountModule,
    BrowserEnvironmentModule,
    BrowserProfileModule,
    CloudInstanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
