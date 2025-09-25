import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { WithdrawRecord, withdrawRecordSchema } from '@/libs/database/schema/withdrawRecord.schema'
import { WithdrawAdminController } from './admin/withdrawAdmin.controller'
import { WithdrawAdminService } from './admin/withdrawAdmin.service'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WithdrawRecord.name, schema: withdrawRecordSchema }]),
  ],
  controllers: [WithdrawController, WithdrawAdminController],
  providers: [WithdrawService, WithdrawAdminService],
})
export class WithdrawModule {}
