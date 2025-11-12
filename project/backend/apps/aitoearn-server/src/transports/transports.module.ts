import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelApiModule } from './channel/channelApi.module'
import { ChannelBaseApi } from './channelBase.api'

@Global()
@Module({
  imports: [HttpModule, ChannelApiModule],
  providers: [
    ChannelBaseApi,
  ],
  exports: [],
})
export class TransportsModule { }
