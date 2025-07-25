import { Module } from '@nestjs/common';
import { WxPlatModule } from '../plat/wxPlat/wxPlat.module';
import { PublishModule } from '../publish/publish.module';
import { InteracteController } from './interact.controller';
import { WxGzhInteractService } from './wxGzhInteract.service';

@Module({
  imports: [WxPlatModule, PublishModule],
  controllers: [InteracteController],
  providers: [WxGzhInteractService],
  exports: [WxGzhInteractService],
})
export class InteracteModule {}
