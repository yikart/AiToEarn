import { Module } from '@nestjs/common'
import { AliGreenModule } from '../core/ali-green/ali-green.module'
import { AccountModule } from './account/account.module'
import { DataCubeModule } from './data-cube/data-cube.module'
import { EngagementModule } from './engagement/engagement.module'
import { FileModule } from './file/file.module'
import { InteracteModule } from './interact/interact.module'
import { MetaModule } from './platforms/meta/meta.module'
import { PlatModule } from './platforms/platforms.module'
import { TiktokModule } from './platforms/tiktok/tiktok.module'
import { TwitterModule } from './platforms/twitter/twitter.module'
import { WxPlatModule } from './platforms/wx-plat/wx-plat.module'
import { YoutubeModule } from './platforms/youtube/youtube.module'
import { PublishModule } from './publishing/publishing.module'
import { SkKeyModule } from './sk-key/sk-key.module'

@Module({
  imports: [
    FileModule,
    SkKeyModule,
    AccountModule,
    PublishModule,
    TwitterModule,
    MetaModule,
    TiktokModule,
    YoutubeModule,
    WxPlatModule,
    DataCubeModule,
    InteracteModule,
    EngagementModule,
    AliGreenModule,
    PlatModule,
  ],
  providers: [],
})
export class CoreModule {}
