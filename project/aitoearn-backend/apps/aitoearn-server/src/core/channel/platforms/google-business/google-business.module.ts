import { Module } from '@nestjs/common'
import { ChannelSharedModule } from '../channel-shared.module'
import { GoogleBusinessController } from './google-business.controller'
import { GoogleBusinessService } from './google-business.service'

@Module({
  imports: [ChannelSharedModule],
  controllers: [GoogleBusinessController],
  providers: [GoogleBusinessService],
  exports: [GoogleBusinessService],
})
export class GoogleBusinessModule {}
