import { Module } from '@nestjs/common'
import { BrowserProfileModule } from '../core/browser-profile'
import { CloudInstanceModule } from '../core/cloud-instance'
import { CloudSpaceModule } from '../core/cloud-space'
import { MultiloginAccountModule } from '../core/multilogin-account'
import { CloudSpaceConfigConsumer } from './cloud-space-config.consumer'
import { CloudSpaceExpirationConsumer } from './cloud-space-expiration.consumer'

@Module({
  imports: [
    BrowserProfileModule,
    CloudInstanceModule,
    CloudSpaceModule,
    MultiloginAccountModule,
  ],
  providers: [CloudSpaceConfigConsumer, CloudSpaceExpirationConsumer],
  exports: [],
})
export class ConsumersModule {}
