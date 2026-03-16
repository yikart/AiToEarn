import { Module } from '@nestjs/common'
import { BilibiliApiModule } from '../../libs/bilibili/bilibili-api.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { BilibiliController } from './bilibili.controller'
import { BilibiliService } from './bilibili.service'

@Module({
  imports: [
    BilibiliApiModule,
    ChannelSharedModule,
  ],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
