import { Global, Module } from '@nestjs/common'
import { IncomeRecordRepository, UserRepository, UserWalletAccountRepository, UserWalletRepository } from '@yikart/mongodb'
import { IncomeController } from './income.controller'
import { IncomeService } from './income.service'
import { UserWalletAccountController } from './userWalletAccount.controller'
import { UserWalletAccountService } from './userWalletAccount.service'

@Global()
@Module({
  controllers: [IncomeController, UserWalletAccountController],
  providers: [
    IncomeService,
    UserWalletAccountService,
    UserRepository,
    IncomeRecordRepository,
    UserWalletRepository,
    UserWalletAccountRepository,
  ],
  exports: [IncomeService, UserWalletAccountService],
})
export class IncomeModule {}
