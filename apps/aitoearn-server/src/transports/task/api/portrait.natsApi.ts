import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../../taskBase.api'

@Injectable()
export class TaskPortraitNatsApi extends TaskBaseApi {
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
    const res = await this.sendMessage<any>(
      `task/userPortrait/report`,
      { ...data, ...(data.lastLoginTime && { lastLoginTime: data.lastLoginTime.toISOString() }) },
    )
    return res
  }
}
