import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { PublishRecord } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class PublishRecordService extends BaseService {
  async createPublishRecord(
    data: Partial<PublishRecord>,
  ) {
    const url = `/internal/publishRecord/create`
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
