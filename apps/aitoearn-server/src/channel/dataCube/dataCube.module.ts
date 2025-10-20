import { Module } from '@nestjs/common'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeApi } from './dataCube.api'
import { DataCubeController } from './dataCube.controller'
import { YouTubeDataService } from './youtubeData.service'

@Module({
  controllers: [DataCubeController],
  providers: [DataCubeApi, BilibiliDataService, YouTubeDataService],
})
export class DataCubeModule {}
