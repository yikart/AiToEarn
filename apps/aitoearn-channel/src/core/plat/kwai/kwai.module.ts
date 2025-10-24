import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { OAuth2Crendential, OAuth2CrendentialSchema } from '../../../libs/database/schema/oauth2Crendential.schema'
import { KwaiApiModule } from '../../../libs/kwai/kwaiApi.module'
import { KwaiController } from './kwai.controller'
import { KwaiService } from './kwai.service'

@Module({
  imports: [ConfigModule, KwaiApiModule, MongooseModule.forFeature([
    { name: OAuth2Crendential.name, schema: OAuth2CrendentialSchema },
  ])],
  controllers: [KwaiController],
  providers: [KwaiService],
  exports: [KwaiService],
})
export class KwaiModule {}
