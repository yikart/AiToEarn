import { Module } from '@nestjs/common'
import { PinterestDataService } from '../../core/data-cube/pinterest-data.service'
import { PinterestModule } from '../../core/platforms/pinterest/pinterest.module'
import { AccountModule } from '../account/account.module'
import { BilibiliModule } from '../platforms/bilibili/bilibili.module'
import { MetaModule } from '../platforms/meta/meta.module'
import { WxPlatModule } from '../platforms/wx-plat/wx-plat.module'
import { YoutubeModule } from '../platforms/youtube/youtube.module'
import { BilibiliDataService } from './bilibili-data.service'
import { DataCubeController } from './data-cube.controller'
import { FacebookDataService } from './facebook-data.service'
import { InstagramDataService } from './instagram.service'
import { ThreadsDataService } from './threads.service'
import { WxGzhDataService } from './wx-gzh-data.service'
import { YoutubeDataService } from './youtube-data.service'

@Module({
  imports: [BilibiliModule, MetaModule, YoutubeModule, WxPlatModule, PinterestModule, AccountModule],
  controllers: [DataCubeController],
  providers: [BilibiliDataService, FacebookDataService, InstagramDataService, ThreadsDataService, YoutubeDataService, WxGzhDataService, PinterestDataService],
  exports: [BilibiliDataService, FacebookDataService, InstagramDataService, ThreadsDataService, YoutubeDataService, WxGzhDataService, PinterestDataService],
})
export class DataCubeModule {}
