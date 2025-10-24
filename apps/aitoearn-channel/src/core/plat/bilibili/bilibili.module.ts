import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BilibiliApiModule } from '../../../libs/bilibili/bilibiliApi.module'
import { OAuth2Crendential, OAuth2CrendentialSchema } from '../../../libs/database/schema/oauth2Crendential.schema'
import { BilibiliController } from './bilibili.controller'
import { BilibiliService } from './bilibili.service'

@Module({
  imports: [
    BilibiliApiModule,
    MongooseModule.forFeature([
      { name: OAuth2Crendential.name, schema: OAuth2CrendentialSchema },
    ]),
  ],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
