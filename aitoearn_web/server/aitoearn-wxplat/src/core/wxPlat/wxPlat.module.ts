import { Module } from '@nestjs/common';
import { WxPlatApiModule } from '@/libs/wxPlat/wxPlatApi.module';
import { WxPlatController } from './wxPlat.controller';
import { WxPlatService } from './wxPlat.service';
import { ServerService } from './server.service';

@Module({
  imports: [WxPlatApiModule],
  controllers: [WxPlatController],
  providers: [WxPlatService, ServerService],
  exports: [WxPlatService],
})
export class WxPlatModule {}
