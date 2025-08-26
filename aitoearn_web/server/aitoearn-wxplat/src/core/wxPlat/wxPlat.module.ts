import { Module } from '@nestjs/common';
import { WxPlatApiModule } from '@/libs/wxPlat/wxPlatApi.module';
import { ServerService } from './server.service';
import { WxPlatController } from './wxPlat.controller';
import { WxPlatService } from './wxPlat.service';

@Module({
  imports: [WxPlatApiModule],
  controllers: [WxPlatController],
  providers: [WxPlatService, ServerService],
  exports: [WxPlatService],
})
export class WxPlatModule {}
