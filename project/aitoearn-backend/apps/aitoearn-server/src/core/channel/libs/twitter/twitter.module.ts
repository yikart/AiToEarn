import { Module } from '@nestjs/common'
import { TwitterService } from './twitter.service'

@Module({
  imports: [],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
