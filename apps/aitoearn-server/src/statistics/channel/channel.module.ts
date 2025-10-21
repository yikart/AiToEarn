import { Module } from '@nestjs/common'
import { ChannelController } from './channel.controller'
import { ChannelService } from './channel.service'

@Module({
  imports: [],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
