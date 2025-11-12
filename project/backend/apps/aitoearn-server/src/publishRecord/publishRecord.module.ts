import { Module } from '@nestjs/common'
import { ContentModule } from '../content/content.module'
import { PublishRecordService } from './publishRecord.service'

@Module({
  imports: [
    ContentModule,
  ],
  providers: [
    PublishRecordService,
  ],
  exports: [PublishRecordService],
})
export class PublishModule {}
