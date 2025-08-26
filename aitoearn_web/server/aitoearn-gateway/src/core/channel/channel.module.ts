import { Module } from '@nestjs/common'
import { InteractModule } from './interact/interact.module'

@Module({
  imports: [InteractModule],
})
export class ChannelModule {}
