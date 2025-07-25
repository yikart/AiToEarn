import { FileModule } from '@core/file/file.module';
import { PinterestModule } from '@core/plat/pinterest/pinterest.module';
import { PublishModule } from '@core/publish/publish.module';
import { Module } from '@nestjs/common';
import { McpModule as TheMcpModule } from '@rekog/mcp-nest'
import { SkKeyAuthGuard } from '@/common/guards/skKeyAuth.guard';
import { AccountModule } from './account/account.module';
import { DataCubeModule } from './dataCube/dataCube.module';
import { InteracteModule } from './interact/interact.module';
import { McpModule } from './mcp/mcp.module';
import { MetaModule } from './plat/meta/meta.module';
import { TiktokModule } from './plat/tiktok/tiktok.module';
import { TwitterModule } from './plat/twitter/twitter.module';
import { WxPlatModule } from './plat/wxPlat/wxPlat.module';
import { YoutubeModule } from './plat/youtube/youtube.module';
import { SkKeyModule } from './skKey/skKey.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    TestModule,
    SkKeyModule,
    McpModule,
    TheMcpModule.forRoot({
      name: 'channel-mcp-server',
      version: '1.0.0',
      guards: [SkKeyAuthGuard],
    }),
    AccountModule,
    PublishModule,
    FileModule,
    TwitterModule,
    MetaModule,
    TiktokModule,
    YoutubeModule,
    WxPlatModule,
    PinterestModule,
    DataCubeModule,
    InteracteModule,
  ],
  providers: [],
})
export class CoreModule {}
