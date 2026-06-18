import { Module } from '@nestjs/common'
import { config } from '../../../config'
import { BilibiliModule } from './bilibili/bilibili.module'
import { DouyinModule } from './douyin/douyin.module'
import { FacebookModule } from './facebook/facebook.module'
import { GoogleBusinessModule } from './google-business/google-business.module'
import { InstagramModule } from './instagram/instagram.module'
import { KwaiModule } from './kwai/kwai.module'
import { LinkedinModule } from './linkedin/linkedin.module'
import { PinterestModule } from './pinterest/pinterest.module'
import { PlatformRegistryModule } from './platforms.registry.module'
import { RedNoteModule } from './rednote/rednote.module'
import { ThreadsModule } from './threads/threads.module'
import { TiktokModule } from './tiktok/tiktok.module'
import { TwitterModule } from './twitter/twitter.module'
import { WechatModule } from './wechat/wechat.module'
import { YoutubeModule } from './youtube/youtube.module'

const c = config.channel

@Module({
  imports: [
    PlatformRegistryModule,
    YoutubeModule.forRoot(c.youtube),
    BilibiliModule.forRoot(c.bilibili),
    DouyinModule.forRoot(c.douyin),
    KwaiModule.forRoot(c.kwai),
    PinterestModule.forRoot(c.pinterest),
    GoogleBusinessModule.forRoot(c.googleBusiness),
    TwitterModule.forRoot(c.twitter),
    TiktokModule.forRoot(c.tiktok),
    FacebookModule.forRoot(c.facebook),
    InstagramModule.forRoot(c.instagram),
    ThreadsModule.forRoot(c.threads),
    LinkedinModule.forRoot(c.linkedin),
    WechatModule.forRoot(c.wechat),
    RedNoteModule.forRoot(c.rednote),
  ],
  exports: [
    PlatformRegistryModule,
    YoutubeModule,
    BilibiliModule,
    DouyinModule,
    KwaiModule,
    PinterestModule,
    GoogleBusinessModule,
    TwitterModule,
    TiktokModule,
    FacebookModule,
    InstagramModule,
    ThreadsModule,
    LinkedinModule,
    WechatModule,
    RedNoteModule,
  ],
})
export class PlatformsModule {}
