import { Module } from '@nestjs/common'
import { PinterestDataService } from '../../core/dataCube/pinterestData.service'
import { PinterestModule } from '../../core/plat/pinterest/pinterest.module'
import { AccountInternalApi } from '../../transports/account/account.api'
import { AccountModule } from '../account/account.module'
import { BilibiliModule } from '../plat/bilibili/bilibili.module'
import { MetaModule } from '../plat/meta/meta.module'
import { WxPlatModule } from '../plat/wxPlat/wxPlat.module'
import { YoutubeModule } from '../plat/youtube/youtube.module'
import { BilibiliDataService } from './bilibiliData.service'
import { DataCubeController } from './dataCube.controller'
import { FacebookDataService } from './facebookData.service'
import { InstagramDataService } from './instagram.service'
import { ThreadsDataService } from './threads.service'
import { WxGzhDataService } from './wxGzhData.service'
import { YoutubeDataService } from './youtubeData.service'

@Module({
  imports: [BilibiliModule, MetaModule, YoutubeModule, WxPlatModule, PinterestModule, AccountModule],
  controllers: [DataCubeController],
  providers: [BilibiliDataService, FacebookDataService, InstagramDataService, ThreadsDataService, YoutubeDataService, WxGzhDataService, PinterestDataService, AccountInternalApi],
  exports: [BilibiliDataService, FacebookDataService, InstagramDataService, ThreadsDataService, YoutubeDataService, WxGzhDataService, PinterestDataService],
})
export class DataCubeModule {}
