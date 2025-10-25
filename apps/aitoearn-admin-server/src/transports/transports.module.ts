import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { AiApi } from './ai/ai.api'
import { ChannelApi } from './channel/channel.api'
import { ChannelBaseApi } from './channelBase.api'
import { CloudSpacesApi } from './cloud-spaces/cloud-spaces.api'
import { MaterialApi } from './content/material.api'
import { PaymentApi } from './payment/payment.api'
import { PaymentBaseApi } from './paymentBase.api'
import { ServerBaseApi } from './serverBase.api'
import { NotificationApi } from './task/notification.api'
import { PortraitApi } from './task/portrait.api'
import { RuleApi } from './task/rule.api'
import { TaskMatcherApi } from './task/task-matcher.api'
import { TaskApi } from './task/task.api'
import { TaskPunishApi } from './task/taskPunish.api'
import { UserTaskApi } from './task/user-task.api'
import { TaskBaseApi } from './taskBase.api'
import { VipApi } from './user/vip.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    ServerBaseApi,
    ChannelBaseApi,
    PaymentBaseApi,
    TaskBaseApi,
    ChannelApi,
    MaterialApi,
    AiApi,
    PaymentApi,
    PortraitApi,
    RuleApi,
    TaskPunishApi,
    UserTaskApi,
    TaskApi,
    NotificationApi,
    VipApi,
    TaskMatcherApi,
    CloudSpacesApi,
  ],
  exports: [
    ChannelApi,
    MaterialApi,
    AiApi,
    PaymentApi,
    PortraitApi,
    RuleApi,
    TaskPunishApi,
    UserTaskApi,
    TaskApi,
    NotificationApi,
    VipApi,
    TaskMatcherApi,
    CloudSpacesApi,
  ],
})
export class TransportsModule { }
