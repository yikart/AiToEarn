/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok Module
 */
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Crendential, OAuth2CrendentialSchema } from '../../../libs/database/schema/oauth2Crendential.schema'
import { TiktokModule as TiktokApiModule } from '../../../libs/tiktok/tiktok.module'
import { TiktokController } from './tiktok.controller'
import { TiktokService } from './tiktok.service'

@Module({
  imports: [
    TiktokApiModule,
    MongooseModule.forFeature([
      { name: OAuth2Crendential.name, schema: OAuth2CrendentialSchema },
    ]),
  ],
  controllers: [TiktokController],
  providers: [TiktokService],
  exports: [TiktokService],
})
export class TiktokModule {}
