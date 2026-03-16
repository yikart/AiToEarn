import { Module } from '@nestjs/common'
import { config } from '../../../config'
import { VolcengineModule } from '../libs/volcengine'
import { AideoTaskStatusScheduler } from './aideo-task-status.scheduler'
import { AideoController } from './aideo.controller'
import { AideoService } from './aideo.service'
import { DramaRecapService } from './drama-recap.service'
import { VideoStyleTransferService } from './video-style-transfer.service'

@Module({
  imports: [
    VolcengineModule.forRoot(config.ai.volcengine),
  ],
  controllers: [AideoController],
  providers: [
    // 专门服务
    VideoStyleTransferService,
    DramaRecapService,
    // 主服务
    AideoService,
    // 调度器
    AideoTaskStatusScheduler,
  ],
  exports: [
    AideoService,
    VideoStyleTransferService,
    DramaRecapService,
  ],
})
export class AideoModule {}
