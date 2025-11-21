import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
