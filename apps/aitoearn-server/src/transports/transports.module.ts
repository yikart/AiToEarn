import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelApiModule } from './channel/channelApi.module'
import { ChannelBaseApi } from './channelBase.api'
import { PaymentNatsApi } from './payment/payment.natsApi'
import { PaymentBaseApi } from './paymentBase.api'
import { TaskApiModule } from './task/taskApi.module'
import { TaskBaseApi } from './taskBase.api'

@Global()
@Module({
  imports: [HttpModule, ChannelApiModule, TaskApiModule],
  providers: [
    ChannelBaseApi,
    PaymentBaseApi,
    TaskBaseApi,
    PaymentNatsApi,
  ],
  exports: [
    PaymentNatsApi,
  ],
})
export class TransportsModule { }
