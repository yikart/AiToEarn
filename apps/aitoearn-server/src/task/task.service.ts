import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { AccountPortraitReportData } from './common'

@Injectable()
export class TaskService {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 账户数据上报
   * @param data
   */
  async accountPortraitReport(
    data: AccountPortraitReportData,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/account/portrait/report',
      data,
    )
    return res.data
  }
}
