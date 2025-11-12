/*
 * @Author: zhangwei
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-06-09 16:11:36
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Credential, OAuth2CredentialSchema } from '../../../libs/database/schema/oauth2Credential.schema'
import { YoutubeApiModule } from '../../../libs/youtube/youtubeApi.module'
import { YoutubeController } from './youtube.controller'
import { YoutubeService } from './youtube.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
    ]),

    YoutubeApiModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
