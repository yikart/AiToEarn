import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'
import { SchedulerModule } from './scheduler'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
