import { Module } from '@nestjs/common'
import { CloudInstanceModule } from '../cloud-instance'
import { MultiloginAccountModule } from '../multilogin-account'
import { BrowserEnvironmentController } from './browser-environment.controller'
import { BrowserEnvironmentService } from './browser-environment.service'

@Module({
  imports: [
    CloudInstanceModule,
    MultiloginAccountModule,
  ],
  controllers: [BrowserEnvironmentController],
  providers: [BrowserEnvironmentService],
  exports: [BrowserEnvironmentService],
})
export class BrowserEnvironmentModule {}
