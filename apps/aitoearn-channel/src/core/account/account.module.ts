import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Account, AccountSchema } from '../../libs/database/schema/account.schema'
import { AccountInternalApi } from '../../transports/account/account.api'
import { PublishingInternalApi } from '../../transports/publishing/publishing.api'
import { TransportModule } from '../../transports/transport.module'
import { AccountService } from './account.service'
import { PublishRecordService } from './publishRecord.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    TransportModule,
  ],
  providers: [AccountService, PublishRecordService, AccountInternalApi, PublishingInternalApi],
  exports: [AccountService, PublishRecordService],
})
export class AccountModule {}
