import { Global, Module } from '@nestjs/common'
import { AppConfigController } from './app-config.controller'
import { AppConfigService } from './app-config.service'

@Global()
@Module({
  imports: [
  ],
  providers: [AppConfigService],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
