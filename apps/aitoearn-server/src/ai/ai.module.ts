import { Module } from '@nestjs/common'
import { config } from '../config'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ChatModule } from './core/chat'
import { ImageModule } from './core/image'
import { ModelsConfigModule } from './core/models-config'
import { VideoModule } from './core/video'
import { OpenaiModule } from './libs/openai'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    OpenaiModule.forRoot(config.ai.openai),
    SchedulerModule,
    ChatModule,
    ImageModule,
    VideoModule,
    ModelsConfigModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule { }
