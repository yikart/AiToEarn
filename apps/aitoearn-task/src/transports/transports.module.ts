import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { AccountHttpApi } from './account/account.httpApi'
import { MaterialNatsApi } from './content/material.natsApi'
import { NotificationNatsApi } from './other/notification.natsApi'
import { ServerBaseApi } from './serverBase.api'
import { IncomeNatsApi } from './user/income.natsApi'
import { UserNatsApi } from './user/user.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    ServerBaseApi,
    MaterialNatsApi,
    NotificationNatsApi,
    IncomeNatsApi,
    UserNatsApi,
    AccountHttpApi,
  ],
  exports: [
    MaterialNatsApi,
    NotificationNatsApi,
    IncomeNatsApi,
    UserNatsApi,
    AccountHttpApi,
  ],
})
export class TransportsModule { }
