import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountPortraitReportData } from '@/transports/task/common'
import { UserPortraitNatsApi } from '@/transports/task/userPortrait.natsApi'

@Injectable()
export class UserPortraitService {
  constructor(
    private readonly userPortraitNatsApi: UserPortraitNatsApi,
  ) {}

  /**
   * 上报用户数据
   * @param data
   */
  @OnEvent('user.portrait.report')
  async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    console.log('user.portrait.report------------', data)
    // return this.userPortraitNatsApi.accountPortraitReport(
    //   data,
    // )
  }
}
