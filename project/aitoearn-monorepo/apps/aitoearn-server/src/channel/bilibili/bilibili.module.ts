import { Module } from '@nestjs/common'
import { BilibiliController } from './bilibili.controller'
import { BilibiliService } from './bilibili.service'

@Module({
  imports: [],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
