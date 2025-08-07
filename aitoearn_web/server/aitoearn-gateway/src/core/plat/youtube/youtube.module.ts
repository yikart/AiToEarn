import { Module } from '@nestjs/common'
import { YoutubeController } from './youtube.controller'
import { YoutubeService } from './youtube.service'

@Module({
  imports: [],
  controllers: [YoutubeController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
