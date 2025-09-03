import { FireflycardModule } from '@libs/fireflycard'
import { Md2cardModule } from '@libs/md2card'
import { MidjourneyModule } from '@libs/midjourney'
import { OpenaiModule } from '@libs/openai'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { config } from '@/config'
import { User, UserSchema } from '@/libs/database/schema'
import { UserNewApiToken, UserNewApiTokenSchema } from '@/libs/database/schema/userNewApiToken.schema'
import { NatsModule } from '@/transports/nats.module'
import { PointsNatsApi } from '@/transports/user/points.natsApi'
import { UserAiController } from './user-ai.controller'
import { UserAiService } from './user-ai.service'

@Module({
  imports: [
    NatsModule,
    OpenaiModule.forRoot({
      apiKey: '',
      baseURL: `${config.newApi.baseURL}v1`,
    }),
    MidjourneyModule.forRoot(config.midjourney),
    Md2cardModule.forRoot(config.md2card),
    FireflycardModule.forRoot(config.fireflycard),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserNewApiToken.name, schema: UserNewApiTokenSchema },
    ]),
  ],
  controllers: [UserAiController],
  providers: [
    UserAiService,
    PointsNatsApi,
  ],
  exports: [
    UserAiService,
    PointsNatsApi,
  ],
})
export class UserAiModule {}
