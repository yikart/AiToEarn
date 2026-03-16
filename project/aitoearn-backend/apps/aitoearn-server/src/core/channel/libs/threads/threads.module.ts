import { Module } from '@nestjs/common'
import { ThreadsService } from './threads.service'

@Module({
  imports: [],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class InstagramModule {}
