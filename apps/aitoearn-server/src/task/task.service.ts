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

  async userPortraitReport(data: {
    userId: string
    name?: string
    avatar?: string
    status?: number
    lastLoginTime?: Date
    contentTags?: Record<string, number>
    totalFollowers?: number
    totalWorks?: number
    totalViews?: number
    totalLikes?: number
    totalCollects?: number
  }) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/user/portrait/report',
      data,
    )
    return res.data
  }

  async pushTaskWithUserCreate(
    userId: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      'http://127.0.0.1:3000/api/account/portrait/report',
      {
        userId,
      },
    )
    return res.data
  }
}
