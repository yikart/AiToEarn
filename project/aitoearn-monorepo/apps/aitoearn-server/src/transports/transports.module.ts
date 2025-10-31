import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelApiModule } from './channel/channelApi.module'
import { ChannelBaseApi } from './channelBase.api'
import { TaskApiModule } from './task/taskApi.module'
import { TaskBaseApi } from './taskBase.api'

@Global()
@Module({
  imports: [HttpModule, ChannelApiModule, TaskApiModule],
  providers: [
    ChannelBaseApi,
    TaskBaseApi,
  ],
  exports: [
  ],
})
export class TransportsModule { }
