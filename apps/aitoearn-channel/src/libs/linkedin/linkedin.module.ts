import { Module } from '@nestjs/common'
import { LinkedinService } from './linkedin.service'

@Module({
  imports: [],
  providers: [LinkedinService],
  exports: [LinkedinService],
})
export class LinkedinModule {}
