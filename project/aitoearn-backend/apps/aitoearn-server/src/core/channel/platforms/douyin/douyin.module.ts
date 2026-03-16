import { Module } from '@nestjs/common'
import { DouyinApiModule } from '../../libs/douyin/douyin-api.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { DouyinController } from './douyin.controller'
import { DouyinService } from './douyin.service'

@Module({
  imports: [
    DouyinApiModule,
    ChannelSharedModule,
  ],
  controllers: [DouyinController],
  providers: [DouyinService],
  exports: [DouyinService],
})
export class DouyinModule {}
