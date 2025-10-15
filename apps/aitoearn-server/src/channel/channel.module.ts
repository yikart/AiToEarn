import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelController } from './channel.controller'
import { ChannelService } from './channel.service'

@Global()
@Module({
  imports: [HttpModule],
  providers: [ChannelService],
  controllers: [ChannelController],
  exports: [ChannelService],
})
export class ChannelModule {}
