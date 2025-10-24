/*
 * @Author: zhangwei
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-06-09 16:11:36
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RedisModule } from '../../../libs'
import { OAuth2Crendential, OAuth2CrendentialSchema } from '../../../libs/database/schema/oauth2Crendential.schema'
import { YoutubeApiModule } from '../../../libs/youtube/youtubeApi.module'
import { AccountInternalApi } from '../../../transports/account/account.api'
import { TransportModule } from '../../../transports/transport.module'
import { YoutubeController } from './youtube.controller'
import { YoutubeService } from './youtube.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OAuth2Crendential.name, schema: OAuth2CrendentialSchema },
    ]),

    RedisModule,
    YoutubeApiModule,
    TransportModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService, AccountInternalApi],
  exports: [YoutubeService],
})
export class YoutubeModule {}
