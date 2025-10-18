import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelController } from './channel.controller'
import { ChannelService } from './channel.service'
import { InteractModule } from './interact/interact.module'

@Global()
@Module({
  imports: [HttpModule, InteractModule],
  providers: [ChannelService],
  controllers: [ChannelController],
  exports: [ChannelService],
})
export class ChannelModule {}
