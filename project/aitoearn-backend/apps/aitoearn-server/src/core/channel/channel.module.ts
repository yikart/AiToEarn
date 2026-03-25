import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { PublishModule } from '../publish-record/publish-record.module'
import { ChannelController } from './channel.controller'
import { ChannelService } from './channel.service'
import { DataCubeModule } from './data-cube/data-cube.module'
import { EngagementController } from './engagement/engagement.controller'
import { EngagementModule } from './engagement/engagement.module'
import { InteracteController } from './interact/interact.controller'
import { InteracteModule } from './interact/interact.module'
import { ChannelInternalModule } from './internal/internal.module'
import { PlatModule } from './platforms/platforms.module'
import { PublishController } from './publish.controller'
import { PublishService } from './publish.service'
import { PublishModule as PublishingModule } from './publishing/publishing.module'

@Global()
@Module({
  imports: [
    HttpModule,
    PlatModule,
    PublishingModule,
    InteracteModule,
    DataCubeModule,
    EngagementModule,
    PublishModule,
    AccountModule,
    ChannelInternalModule,
  ],
  providers: [ChannelService, PublishService],
  controllers: [
    PublishController,
    InteracteController,
    EngagementController,
    ChannelController,
  ],
  exports: [ChannelService, PublishingModule, PlatModule],
})
export class ChannelModule { }
