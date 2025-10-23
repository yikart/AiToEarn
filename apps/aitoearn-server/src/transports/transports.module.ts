import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { ChannelApiModule } from './channel/channelApi.module'
import { ChannelBaseApi } from './channelBase.api'
import { PaymentApi } from './payment/payment.api'
import { PaymentBaseApi } from './paymentBase.api'
import { NotificationApi } from './task/notification.api'
import { PortraitApi } from './task/portrait.api'
import { RuleApi } from './task/rule.api'
import { TaskApi } from './task/task.api'
import { TaskPunishApi } from './task/taskPunish.api'
import { UserTaskApi } from './task/user-task.api'
import { TaskBaseApi } from './taskBase.api'

@Global()
@Module({
  imports: [HttpModule, ChannelApiModule],
  providers: [
    ChannelBaseApi,
    PaymentBaseApi,
    TaskBaseApi,
    PaymentApi,
    PortraitApi,
    RuleApi,
    TaskPunishApi,
    UserTaskApi,
    TaskApi,
    NotificationApi,
  ],
  exports: [
    PaymentApi,
    PortraitApi,
    RuleApi,
    TaskPunishApi,
    UserTaskApi,
    TaskApi,
    NotificationApi,
  ],
})
export class TransportsModule { }
