import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { FingerprintNatsApi } from '@transports/account/fingerprint.natsApi'
import { config } from '@/config'
import { AccountNatsApi } from './account/account.natsApi'
import { AccountGroupNatsApi } from './account/accountGroup.natsApi'
import { AiNatsApi } from './ai/ai.natsApi'
import { PlatBilibiliNatsApi } from './channel/bilibili.natsApi'
import { DataCubeNatsApi } from './channel/dataCube.natsApi'
import { InteractNatsApi } from './channel/interact/interact.natsApi'
import { InteractionRecordNatsApi } from './channel/interact/interactionRecord.natsApi'
import { ReplyCommentRecordNatsApi } from './channel/interact/replyCommentRecord.natsApi'
import { PlatMetaNatsApi } from './channel/meta.natsApi'
import { PlatWxGzhNatsApi } from './channel/wxGzh.natsApi'
import { MaterialNatsApi } from './content/material.natsApi'
import { MediaNatsApi } from './content/media.natsApi'
import { NatsService } from './nats.service'
import { NotificationNatsApi } from './notification/notification.natsApi'
import { AppConfigsNatsApi } from './other/appConfigs.natsApi'
import { FeedbackNatsApi } from './other/feedback.natsApi'
import { GologinNatsApi } from './other/gologin.natsApi'
import { PaymentNatsApi } from './payment/payment.natsApi'
import { PlatKwaiNatsApi } from './plat/kwai.natsApi'
import { PlatPinterestNatsApi } from './plat/pinterest.natsApi'
import { PlatPublishNatsApi } from './plat/publish.natsApi'
import { ChannelSkKeyNatsApi } from './plat/skKeyNatsApi.natsApi'
import { PlatTiktokNatsApi } from './plat/tiktok.natsApi'
import { PlatTwitterNatsApi } from './plat/twitter.natsApi'
import { PlatYoutubeNatsApi } from './plat/youtube.natsApi'
import { StatisticsNatsApi } from './statistics/statistics.natsApi'
import { TaskMaterialNatsApi } from './task/material.natsApi'
import { TaskNatsApi } from './task/task.natsApi'
import { UserTaskNatsApi } from './task/user-task.natsApi'
import { UserPointsNatsApi } from './user/points.natsApi'
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
    GologinNatsApi,
    MaterialNatsApi,
    MediaNatsApi,
    UserVipNatsApi,
    UserPointsNatsApi,
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
    FingerprintNatsApi,
    StatisticsNatsApi,
    AppConfigsNatsApi,
    ReplyCommentRecordNatsApi,
    InteractionRecordNatsApi,
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
    FingerprintNatsApi,
    GologinNatsApi,
    MaterialNatsApi,
    MediaNatsApi,
    UserVipNatsApi,
    UserPointsNatsApi,
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
    StatisticsNatsApi,
    AppConfigsNatsApi,
    ReplyCommentRecordNatsApi,
    InteractionRecordNatsApi,
  ],
})
export class NatsModule {}
