import { Module } from '@nestjs/common'
import { TwitterModule as TwitterApiModule } from '../../libs/twitter/twitter.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { TwitterController } from './twitter.controller'
import { TwitterService } from './twitter.service'

@Module({
  imports: [
    TwitterApiModule,
    ChannelSharedModule,
  ],
  controllers: [TwitterController],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
