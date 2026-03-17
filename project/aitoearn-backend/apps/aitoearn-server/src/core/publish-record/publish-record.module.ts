import { Global, Module } from '@nestjs/common'
import { ContentModule } from '../content/content.module'
import { PublishRecordService } from './publish-record.service'

@Global()
@Module({
  imports: [ContentModule],
  providers: [PublishRecordService],
  exports: [PublishRecordService],
})
export class PublishModule {}
