import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BilibiliApiModule } from '../../../libs/bilibili/bilibiliApi.module'
import { OAuth2Credential, OAuth2CredentialSchema } from '../../../libs/database/schema/oauth2Credential.schema'
import { BilibiliController } from './bilibili.controller'
import { BilibiliService } from './bilibili.service'

@Module({
  imports: [
    BilibiliApiModule,
    MongooseModule.forFeature([
      { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
    ]),
  ],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
