import { Module } from '@nestjs/common'
import { AitoearnUserClientModule } from '@yikart/aitoearn-user-client'
import { S3Module } from '@yikart/aws-s3'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'
import { ChatModule } from './core/chat'
import { ImageModule } from './core/image'
import { ModelsConfigModule } from './core/models-config'
import { VideoModule } from './core/video'
import { OpenaiModule } from './libs/openai'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    AitoearnUserClientModule.forRoot(config.nats),
    S3Module.forRoot(config.s3),
    MongodbModule.forRoot(config.mongodb),
    OpenaiModule.forRoot(config.ai.openai),
    SchedulerModule,
    ChatModule,
    ImageModule,
    VideoModule,
    ModelsConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
