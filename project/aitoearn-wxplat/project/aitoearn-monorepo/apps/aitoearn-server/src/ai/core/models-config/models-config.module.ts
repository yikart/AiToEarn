import { Module } from '@nestjs/common'
import { ModelsConfigService } from './models-config.service'

@Module({
  imports: [
  ],
  controllers: [],
  providers: [
    ModelsConfigService,
  ],
  exports: [
    ModelsConfigService,
  ],
})
export class ModelsConfigModule {}
