import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { NatsService } from '../nats.service'
import { AccountPortraitReportData } from './common'

@Injectable()
export class AccountPortraitNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 上报账号数据
   * @param data
   * @returns
   */
  async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    return await this.natsService.sendMessage<boolean>(
      NatsApi.task.accountPortrait.report,
      data,
    )
  }
}
