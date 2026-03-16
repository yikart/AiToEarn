import { Module } from '@nestjs/common'
import { PinterestApiModule } from '../../libs/pinterest/pinterest-api.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { PinterestController } from './pinterest.controller'
import { PinterestService } from './pinterest.service'

@Module({
  imports: [
    PinterestApiModule,
    ChannelSharedModule,
  ],
  controllers: [PinterestController],
  providers: [PinterestService],
  exports: [PinterestService],
})
export class PinterestModule {}
