import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'
import { ChatModule } from './core/chat'
import { ImageModule } from './core/image'
import { VideoModule } from './core/video'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    SchedulerModule,
    ChatModule,
    ImageModule,
    VideoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
