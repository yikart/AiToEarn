import { Module } from '@nestjs/common'
import { TwitterController } from './twitter.controller'

@Module({
  imports: [],
  controllers: [TwitterController],
  providers: [],
  exports: [],
})
export class TwitterModule {}
