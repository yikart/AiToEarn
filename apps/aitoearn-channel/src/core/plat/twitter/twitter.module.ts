import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Crendential, OAuth2CrendentialSchema } from '../../../libs/database/schema/oauth2Crendential.schema'
import { TwitterModule as TwitterApiModule } from '../../../libs/twitter/twitter.module'
import { TwitterController } from './twitter.controller'
import { TwitterService } from './twitter.service'

@Module({
  imports: [
    TwitterApiModule,
    MongooseModule.forFeature([
      { name: OAuth2Crendential.name, schema: OAuth2CrendentialSchema },
    ]),
  ],
  controllers: [TwitterController],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
