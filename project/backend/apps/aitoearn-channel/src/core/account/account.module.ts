import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Account, AccountSchema } from '../../libs/database/schema/account.schema'
import { AccountService } from './account.service'
import { PublishRecordService } from './publishRecord.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  ],
  providers: [AccountService, PublishRecordService],
  exports: [AccountService, PublishRecordService],
})
export class AccountModule {}
