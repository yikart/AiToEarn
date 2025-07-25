import { HttpExceptionFilter } from '@common/filters/httpException.filter'
import { Global, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { config } from '@/config'
import { AccountNatsApi } from './account/account.natsApi'
import { AccountGroupNatsApi } from './account/accountGroup.natsApi'
import { AiNatsApi } from './ai/ai.natsApi'
import { PlatBilibiliNatsApi } from './channel/bilibili.natsApi'
import { DataCubeNatsApi } from './channel/dataCube.natsApi'
import { InteractNatsApi } from './channel/interact.natsApi'
import { PlatMetaNatsApi } from './channel/meta.natsApi'
import { PlatWxGzhNatsApi } from './channel/wxGzh.natsApi'
import { MaterialNatsApi } from './content/material.natsApi'
import { MediaNatsApi } from './content/media.natsApi'
import { NatsService } from './nats.service'
import { NotificationNatsApi } from './notification/notification.natsApi'
import { FeedbackNatsApi } from './other/feedback.natsApi'
import { PaymentNatsApi } from './payment/payment.natsApi'
import { PlatKwaiNatsApi } from './plat/kwai.natsApi'
import { PlatPinterestNatsApi } from './plat/pinterest.natsApi'
import { PlatPublishNatsApi } from './plat/publish.natsApi'
import { ChannelSkKeyNatsApi } from './plat/skKeyNatsApi.natsApi'
import { PlatTiktokNatsApi } from './plat/tiktok.natsApi'
import { PlatTwitterNatsApi } from './plat/twitter.natsApi'
import { PlatYoutubeNatsApi } from './plat/youtube.natsApi'
import { TaskMaterialNatsApi } from './task/material.natsApi'
import { TaskNatsApi } from './task/task.natsApi'
import { UserTaskNatsApi } from './task/user-task.natsApi'
import { UserNatsApi } from './user/user.natsApi'
import { UserVipNatsApi } from './user/vip.natsApi'

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AITOEARN_SERVICE',
        transport: Transport.NATS,
        options: {
          name: config.nats.name,
          servers: config.nats.servers,
          user: config.nats.user,
          pass: config.nats.pass,
        },
      },
    ]),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    NatsService,
    AccountNatsApi,
    AccountGroupNatsApi,
    AiNatsApi,
    PlatBilibiliNatsApi,
    PlatKwaiNatsApi,
    PlatTiktokNatsApi,
    PlatYoutubeNatsApi,
    UserNatsApi,
    FeedbackNatsApi,
    MaterialNatsApi,
    MediaNatsApi,
    UserVipNatsApi,
    PlatWxGzhNatsApi,
    PlatPublishNatsApi,
    PlatPinterestNatsApi,
    PaymentNatsApi,
    PlatTwitterNatsApi,
    TaskNatsApi,
    TaskMaterialNatsApi,
    UserTaskNatsApi,
    NotificationNatsApi,
    PlatMetaNatsApi,
    DataCubeNatsApi,
    InteractNatsApi,
    ChannelSkKeyNatsApi,
  ],
  exports: [
    NatsService,
    AccountNatsApi,
    AccountGroupNatsApi,
    AiNatsApi,
    PlatBilibiliNatsApi,
    PlatKwaiNatsApi,
    PlatTiktokNatsApi,
    PlatYoutubeNatsApi,
    UserNatsApi,
    FeedbackNatsApi,
    MaterialNatsApi,
    MediaNatsApi,
    UserVipNatsApi,
    PlatWxGzhNatsApi,
    PlatPublishNatsApi,
    PlatPinterestNatsApi,
    PaymentNatsApi,
    PlatTwitterNatsApi,
    TaskNatsApi,
    TaskMaterialNatsApi,
    UserTaskNatsApi,
    NotificationNatsApi,
    PlatMetaNatsApi,
    DataCubeNatsApi,
    InteractNatsApi,
    ChannelSkKeyNatsApi,
  ],
})
export class NatsModule {}
