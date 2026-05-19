import { Module } from '@nestjs/common'
import { MetricEventHelperModule } from '@yikart/helpers'
import { ContentModule } from '../../content/content.module'
import { PublishModule } from '../../publish-record/publish-record.module'
import { ChannelAccountService } from './channel-account.service'

@Module({
  imports: [ContentModule, PublishModule, MetricEventHelperModule],
  providers: [ChannelAccountService],
  exports: [ChannelAccountService, MetricEventHelperModule],
})
export class ChannelSharedModule {}
