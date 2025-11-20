import { Module } from '@nestjs/common'
import { config } from '../../config'
import { DashscopeModule } from '../libs/dashscope'
import { KlingModule } from '../libs/kling'
import { Sora2Module } from '../libs/sora2'
import { VolcengineModule } from '../libs/volcengine'
import { ModelsConfigModule } from '../models-config'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'

@Module({
  imports: [
    KlingModule.forRoot(config.ai.kling),
    VolcengineModule.forRoot(config.ai.volcengine),
    DashscopeModule.forRoot(config.ai.dashscope),
    Sora2Module.forRoot(config.ai.sora2),
    ModelsConfigModule,
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
