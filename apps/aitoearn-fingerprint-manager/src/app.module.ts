import { MongodbModule } from '@aitoearn/mongodb'
import { Module } from '@nestjs/common'
import { config } from './config'
import { MultiloginAccountModule } from './multilogin-account'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    MultiloginAccountModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
