import { Module } from '@nestjs/common'
import { config } from '../../config'
import { DashscopeModule } from '../../libs/dashscope'
import { KlingModule } from '../../libs/kling'
import { VolcengineModule } from '../../libs/volcengine'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'

@Module({
  imports: [
    KlingModule.forRoot(config.ai.kling),
    VolcengineModule.forRoot(config.ai.volcengine),
    DashscopeModule.forRoot(config.ai.dashscope),
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
