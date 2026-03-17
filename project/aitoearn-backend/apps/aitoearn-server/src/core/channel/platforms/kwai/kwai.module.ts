import { Module } from '@nestjs/common'
import { KwaiApiModule } from '../../libs/kwai/kwai.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { KwaiController } from './kwai.controller'
import { KwaiService } from './kwai.service'

@Module({
  imports: [KwaiApiModule, ChannelSharedModule],
  controllers: [KwaiController],
  providers: [KwaiService],
  exports: [KwaiService],
})
export class KwaiModule {}
