import { Module } from '@nestjs/common'
import { TwitterModule as TwitterApiModule } from '../../libs/twitter/twitter.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { TwitterBillingService } from './twitter-billing.service'
import { TwitterController } from './twitter.controller'
import { TwitterService } from './twitter.service'

@Module({
  imports: [
    TwitterApiModule,
    ChannelSharedModule,
  ],
  controllers: [TwitterController],
  providers: [TwitterService, TwitterBillingService],
  exports: [TwitterService, TwitterBillingService],
})
export class TwitterModule {}
