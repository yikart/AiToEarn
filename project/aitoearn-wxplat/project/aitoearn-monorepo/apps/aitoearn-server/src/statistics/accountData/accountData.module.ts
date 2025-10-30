import { Module } from '@nestjs/common'
import { AccountDataController } from './accountData.controller'
import { AccountDataService } from './accountData.service'

@Module({
  imports: [],
  controllers: [AccountDataController],
  providers: [AccountDataService],
})
export class AccountDataModule {}
