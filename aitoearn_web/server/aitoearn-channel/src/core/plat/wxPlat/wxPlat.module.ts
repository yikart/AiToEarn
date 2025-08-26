import { forwardRef, Module } from '@nestjs/common';
import { PublishModule } from '@/core/publish/publish.module';
import { MyWxPlatApiModule } from '@/libs/myWxPlat/myWxPlatApi.module';
import { WxGzhApiModule } from '@/libs/wxGzh/wxGzhApi.module';
import { WxGzhService } from './wxGzh.service';
import { WxPlatController } from './wxPlat.controller';
import { WxPlatService } from './wxPlat.service';

@Module({
  imports: [MyWxPlatApiModule, WxGzhApiModule, forwardRef(() => PublishModule)],
  controllers: [WxPlatController],
  providers: [WxPlatService, WxGzhService],
  exports: [WxPlatService, WxGzhService],
})
export class WxPlatModule {}
