import { Module } from '@nestjs/common'
import { ContentModule } from '../../content/content.module'
import { PublishModule } from '../../publish-record/publish-record.module'
import { ChannelAccountService } from './channel-account.service'

@Module({
  imports: [ContentModule, PublishModule],
  providers: [ChannelAccountService],
  exports: [ChannelAccountService],
})
export class ChannelSharedModule {}
