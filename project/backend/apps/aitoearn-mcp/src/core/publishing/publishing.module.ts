import { Module } from '@nestjs/common'
import { PublishingService } from './publishing.service'

@Module({
  imports: [],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule { }
