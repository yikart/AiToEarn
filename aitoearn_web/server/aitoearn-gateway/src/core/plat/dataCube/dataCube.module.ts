import { Module } from '@nestjs/common'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeController } from './dataCube.controller'
import { YouTubeDataService } from './youtubeData.service'

@Module({
  controllers: [DataCubeController],
  providers: [BilibiliDataService, YouTubeDataService],
})
export class DataCubeModule {}
