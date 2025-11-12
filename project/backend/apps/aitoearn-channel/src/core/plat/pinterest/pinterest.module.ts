import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Credential, OAuth2CredentialSchema } from '../../../libs/database/schema/oauth2Credential.schema'
import { PinterestApiModule } from '../../../libs/pinterest/pinterestApi.module'
import { PinterestController } from './pinterest.controller'
import { PinterestService } from './pinterest.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
    ]),
    PinterestApiModule,
  ],
  controllers: [PinterestController],
  providers: [PinterestService],
  exports: [PinterestService],
})
export class PinterestModule {}
