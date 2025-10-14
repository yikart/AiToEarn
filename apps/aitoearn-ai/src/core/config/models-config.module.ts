import { Module } from '@nestjs/common'
import { ModelsConfigController } from './models-config.controller'
import { ModelsConfigService } from './models-config.service'

@Module({
  imports: [
  ],
  controllers: [ModelsConfigController],
  providers: [
    ModelsConfigService,
  ],
  exports: [
    ModelsConfigService,
  ],
})
export class ModelsConfigModule {}
