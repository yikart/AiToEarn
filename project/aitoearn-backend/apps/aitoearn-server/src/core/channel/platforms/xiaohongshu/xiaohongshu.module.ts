import { Module } from '@nestjs/common'
import { XiaohongshuService } from './xiaohongshu.service'

@Module({
  imports: [],
  controllers: [],
  providers: [XiaohongshuService],
  exports: [XiaohongshuService],
})
export class XiaohongshuModule {}
