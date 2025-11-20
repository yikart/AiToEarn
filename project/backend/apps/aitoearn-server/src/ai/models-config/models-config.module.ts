import { Module } from '@nestjs/common'
import { ChatModule } from '../chat'
import { ImageModule } from '../image'
import { VideoModule } from '../video'
import { ModelsConfigController } from './models-config.controller'
import { ModelsConfigService } from './models-config.service'

@Module({
  imports: [
    ChatModule,
    ImageModule,
    VideoModule,
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
