import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountPortraitNatsApi } from '@/transports/task/accountPortrait.natsApi'
import { AccountPortraitReportData } from '@/transports/task/common'

@Injectable()
export class AccountPortraitService {
  constructor(
    private readonly accountPortraitNatsApi: AccountPortraitNatsApi,
  ) {}

  /**
   * 上报账号数据
   * @param data
   */
  @OnEvent('account.portrait.report')
  async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    return this.accountPortraitNatsApi.accountPortraitReport(
      data,
    )
  }
}
