import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'

@Injectable()
export class TaskPortraitNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 用户数据上报
   */
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
      `${config.task.baseUrl}/task/userPortrait/report`,
      { ...data, ...(data.lastLoginTime && { lastLoginTime: data.lastLoginTime.toISOString() }) },
    )
    return res.data
  }
}
