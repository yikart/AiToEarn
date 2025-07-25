import { Module } from '@nestjs/common'
import { BilibiliApiModule } from '@/libs/bilibili/bilibiliApi.module'
import { BilibiliController } from './bilibili.controller'
import { BilibiliService } from './bilibili.service'

@Module({
  imports: [
    BilibiliApiModule,
  ],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
