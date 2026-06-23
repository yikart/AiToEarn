import { Module } from '@nestjs/common'
import { config } from '../../../config'
import { ModelsConfigModule } from '../models-config'
import { DashscopeVideoModule } from './dashscope'
import { GrokVideoModule } from './grok'
import { OpenAIVideoModule } from './openai'
import { RelayVideoModule } from './relay'
import { VideoTaskStatusScheduler } from './video-task-status.scheduler'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'
import { VolcengineVideoModule } from './volcengine'

const relayVideoModule = RelayVideoModule.forRoot(config.ai.relay)

@Module({
  imports: [
    ModelsConfigModule,
    VolcengineVideoModule,
    OpenAIVideoModule,
    GrokVideoModule,
    DashscopeVideoModule,
    relayVideoModule,
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoTaskStatusScheduler],
  exports: [VideoService, VolcengineVideoModule, OpenAIVideoModule, GrokVideoModule, DashscopeVideoModule, relayVideoModule],
})
export class VideoModule {}
