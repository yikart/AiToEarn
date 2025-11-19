import { Module } from '@nestjs/common'
import { config } from '../config'
import { ChatModule } from './chat'
import { ImageModule } from './image'
import { OpenaiModule } from './libs/openai'
import { LogsModule } from './logs'
import { ModelsConfigModule } from './models-config'
import { SchedulerModule } from './scheduler'
import { VideoModule } from './video'

@Module({
  imports: [
    OpenaiModule.forRoot(config.ai.openai),
    SchedulerModule,
    ChatModule,
    LogsModule,
    ImageModule,
    VideoModule,
    ModelsConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [ChatModule],
})
export class AiModule { }
