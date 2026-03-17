import { Module } from '@nestjs/common'
import { PlatModule } from '../platforms/platforms.module'
import { ChannelInternalController } from './channel.controller'

@Module({
  imports: [PlatModule],
  controllers: [ChannelInternalController],
})
export class ChannelInternalModule {}
