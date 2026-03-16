import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { PromotionPostDetail, PublishRecord } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class PublishRecordService extends BaseService {
  async deletePublishRecordById(id: string) {
    const url = `/internal/publishRecord/delete`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id },
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordInfo(id: string) {
    const url = `/internal/publishRecord/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id },
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordList(filters: any) {
    const url = `/internal/publishRecord/list`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { ...filters },
    }
    const res = await this.request<{ records: PublishRecord[], total: number }>(
      url,
      config,
    )
    return res
  }

  async getPublishInfoData(userId: string) {
    const url = `/internal/publishInfo/data`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { userId },
    }
    const res = await this.request<any>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordByDataId(
    accountType: string,
    dataId: string,
  ) {
    const url = `/internal/publishRecord/infoByDataId`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { accountType, dataId },
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async getPublishDayInfoList(
    filters: any,
    page: { pageNum: number, pageSize: number },
  ) {
    const url = `/internal/PublishDayInfo/list`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { filters, page },
    }
    const res = await this.request<{ records: any[], total: number }>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordDetail(data: { id: string, userId?: string }) {
    const url = `/internal/publishRecord/detail`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordByTaskId(
    taskId: string,
    userId: string,
  ) {
    const url = `/internal/publishRecord/detail/byTaskId`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { taskId, userId },
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  /**
   * 根据广告主推广任务ID获取发布记录列表（广告主用）
   */
  async getPublishRecordListByAdvertiserTaskId(
    advertiserTaskId: string,
    query?: {
      status?: number
      accountType?: string
      pageNo?: number
      pageSize?: number
    },
  ) {
    const url = `/internal/publishRecord/list/byAdvertiserTaskId`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { advertiserTaskId, ...query },
    }
    const res = await this.request<{ records: PublishRecord[], total: number }>(
      url,
      config,
    )
    return res
  }

  /**
   * 根据广告主推广任务ID获取发布统计数据（广告主用）
   * 从 promotionPostInsight 表查询作品数据统计
   */
  async getPublishStatisticsByAdvertiserTaskId(advertiserTaskId: string) {
    const url = `/internal/statistics/promotion-post/statistics`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { advertiserTaskId },
    }
    const res = await this.request<{
      totalPosts: number
      totalViewCount: number
      totalLikeCount: number
      totalCommentCount: number
      totalShareCount: number
      totalFavoriteCount: number
    }>(
      url,
      config,
    )
    return res
  }

  /**
   * 根据广告主推广任务ID获取近7天趋势数据（广告主用）
   */
  async getPublishTrendByAdvertiserTaskId(advertiserTaskId: string, days?: number) {
    const url = `/internal/statistics/promotion-post/trend`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { advertiserTaskId, days },
    }
    const res = await this.request<{
      date: string
      totalViewCount: number
      totalLikeCount: number
      totalCommentCount: number
      totalShareCount: number
      totalFavoriteCount: number
    }[]>(
      url,
      config,
    )
    return res
  }

  async getPromotionPostDetailByDataId(dataId: string) {
    const url = `/internal/statistics/promotion-post/detail`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { postId: dataId },
    }
    const res = await this.request<PromotionPostDetail | null>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordToUserTask(userTaskId: string) {
    const url = `/internal/publishRecord/userTask`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { userTaskId },
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async donePublishRecord(data: Partial<PublishRecord>) {
    const url = `/internal/publishRecord/done`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }
}
