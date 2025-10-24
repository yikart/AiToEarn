import { Module } from '@nestjs/common'
import { ContentModule } from '../content/content.module'
import { PublishRecordController } from './publishRecord.controller'
import { PublishRecordService } from './publishRecord.service'

@Module({
  imports: [
    ContentModule,
  ],
  providers: [
    PublishRecordService,
  ],
  controllers: [PublishRecordController],
  exports: [PublishRecordService],
})
export class PublishModule {}
