import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountPortraitReportData } from '../../channel/common'
import { UserPortraitReportData } from '../../transports/task/api/common'
import { TaskPortraitNatsApi } from '../../transports/task/api/portrait.natsApi'

@Injectable()
export class TaskPortraitService {
  constructor(private readonly taskPortraitNatsApi: TaskPortraitNatsApi) { }

  @OnEvent('task.userPortrait.report')
  async userPortraitReport(data: UserPortraitReportData) {
    return await this.taskPortraitNatsApi.userPortraitReport(data)
  }

  @OnEvent('task.accountPortrait.report')
  async accountPortraitReport(data: AccountPortraitReportData) {
    return await this.taskPortraitNatsApi.accountPortraitReport(data)
  }
}
