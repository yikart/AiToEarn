import { forwardRef, Module } from '@nestjs/common'
import { MyWxPlatApiModule } from '../../../libs/my-wx-plat/my-wx-plat.module'
import { WxGzhApiModule } from '../../../libs/wx-gzh/wx-gzh.module'
import { PublishModule } from '../../publishing/publishing.module'
import { WxGzhService } from './wx-gzh.service'
import { WxPlatController } from './wx-plat.controller'
import { WxPlatService } from './wx-plat.service'

@Module({
  imports: [MyWxPlatApiModule, WxGzhApiModule, forwardRef(() => PublishModule)],
  controllers: [WxPlatController],
  providers: [WxPlatService, WxGzhService],
  exports: [WxPlatService, WxGzhService],
})
export class WxPlatModule {}
