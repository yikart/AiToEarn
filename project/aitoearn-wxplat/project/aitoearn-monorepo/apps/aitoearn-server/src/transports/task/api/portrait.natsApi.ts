import { Injectable } from '@nestjs/common'
import { AccountPortraitReportData } from '../../../channel/common'
import { TaskBaseApi } from '../../taskBase.api'
import { UserPortraitReportData } from './common'

@Injectable()
export class TaskPortraitNatsApi extends TaskBaseApi {
  /**
   * 用户数据上报
   */
  async userPortraitReport(data: UserPortraitReportData) {
    const res = await this.sendMessage<any>(
      `task/user/portrait/report`,
      { ...data, ...(data.lastLoginTime && { lastLoginTime: data.lastLoginTime.toISOString() }) },
    )
    return res
  }

  /**
   * 频道账号数据上报
   */
  async accountPortraitReport(data: AccountPortraitReportData) {
    const res = await this.sendMessage<any>(
      `task/account/portrait/report`,
      data,
    )
    return res
  }
}
