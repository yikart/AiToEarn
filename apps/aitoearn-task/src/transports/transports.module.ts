import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { AccountHttpApi } from './account/account.httpApi'
import { MaterialNatsApi } from './content/material.natsApi'
import { MediaNatsApi } from './content/media.natsApi'
import { NotificationNatsApi } from './other/notification.natsApi'
import { TransportsService } from './transports.service'
import { IncomeNatsApi } from './user/income.natsApi'
import { UserNatsApi } from './user/user.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    TransportsService,
    MaterialNatsApi,
    MediaNatsApi,
    NotificationNatsApi,
    IncomeNatsApi,
    UserNatsApi,
    AccountHttpApi,
  ],
  exports: [
    TransportsService,
    MaterialNatsApi,
    MediaNatsApi,
    NotificationNatsApi,
    IncomeNatsApi,
    UserNatsApi,
    AccountHttpApi,
  ],
})
export class TransportsModule { }
