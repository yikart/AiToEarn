import { Global, Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'

@Global()
@Module({
  imports: [UserModule],
  providers: [StatisticsService, AccountService],
  controllers: [AccountController, StatisticsController],
})
export class AccountModule {}
