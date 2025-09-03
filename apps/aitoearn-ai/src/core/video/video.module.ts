import { Module } from '@nestjs/common'
import { UserAiModule } from '../user-ai'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'

@Module({
  imports: [
    UserAiModule,
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
