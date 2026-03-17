import { Module } from '@nestjs/common'
import { TiktokService } from './tiktok.service'

@Module({
  imports: [],
  providers: [TiktokService],
  exports: [TiktokService],
})
export class TiktokModule {}
