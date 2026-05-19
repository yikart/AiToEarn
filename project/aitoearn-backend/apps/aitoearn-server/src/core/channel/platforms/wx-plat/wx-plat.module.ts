import { Module } from '@nestjs/common'
import { MyWxPlatApiModule } from '../../libs/my-wx-plat/my-wx-plat.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { WxGzhController } from './wx-gzh.controller'
import { WxGzhService } from './wx-gzh.service'
import { WxPlatController } from './wx-plat.controller'
import { WxPlatService } from './wx-plat.service'

@Module({
  imports: [MyWxPlatApiModule, ChannelSharedModule],
  controllers: [WxGzhController, WxPlatController],
  providers: [WxPlatService, WxGzhService],
  exports: [WxPlatService, WxGzhService],
})
export class WxPlatModule {}
