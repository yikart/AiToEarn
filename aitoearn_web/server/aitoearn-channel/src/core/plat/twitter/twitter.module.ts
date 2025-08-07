import { Module } from '@nestjs/common'
import { TwitterModule as TwitterApiModule } from '@/libs/twitter/twitter.module'
import { TwitterController } from './twitter.controller'
import { TwitterService } from './twitter.service'

@Module({
  imports: [
    TwitterApiModule,
  ],
  controllers: [TwitterController],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
