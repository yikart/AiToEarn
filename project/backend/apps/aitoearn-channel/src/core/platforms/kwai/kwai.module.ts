import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Credential, OAuth2CredentialSchema } from '../../../libs/database/schema/oauth2Credential.schema'
import { KwaiApiModule } from '../../../libs/kwai/kwai.module'
import { KwaiController } from './kwai.controller'
import { KwaiService } from './kwai.service'

@Module({
  imports: [ConfigModule, KwaiApiModule, MongooseModule.forFeature([
    { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  ])],
  controllers: [KwaiController],
  providers: [KwaiService],
  exports: [KwaiService],
})
export class KwaiModule {}
