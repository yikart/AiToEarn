import { Module } from '@nestjs/common'
import { config } from '../../config'
import { AideoModule } from './aideo'
import { AssetsModule } from './assets'
import { ChatModule } from './chat'
import { ImageModule } from './image'
import { AtlascloudModule } from './libs/atlascloud'
import { OpenaiModule } from './libs/openai'
import { LogsModule } from './logs'
import { ModelsConfigModule } from './models-config'
import { VideoModule } from './video'

@Module({
  imports: [
    OpenaiModule.forRoot(config.ai.openai),
    AtlascloudModule.forRoot(config.ai.atlascloud),
    ChatModule,
    LogsModule,
    ImageModule,
    VideoModule,
    AideoModule,
    ModelsConfigModule,
    AssetsModule,
  ],
  controllers: [],
  providers: [],
  exports: [ChatModule, LogsModule, ImageModule, VideoModule, AideoModule, ModelsConfigModule, AssetsModule],
})
export class AiModule { }
