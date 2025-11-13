import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SkKey, SkKeySchema } from '../../libs/database/schema/skKey.schema'
import {
  SkKeyRefAccount,
  SkKeyRefAccountSchema,
} from '../../libs/database/schema/skKeyRefAccount.schema'
import { PublishModule } from '../publishing/publishing.module'
import { SkKeyController } from './sk-key.controller'
import { SkKeyService } from './sk-key.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SkKey.name, schema: SkKeySchema },
      { name: SkKeyRefAccount.name, schema: SkKeyRefAccountSchema },
    ]),
    PublishModule,
  ],
  providers: [SkKeyService],
  controllers: [SkKeyController],
  exports: [SkKeyService],
})
export class SkKeyModule {}
