import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { PublishRecord, PublishStatus } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class PublishingService extends BaseService {
  /**
   * 创建账户
   * @param data
   * @returns
   */
  async createPublishRecord(
    data: Partial<PublishRecord>,
  ) {
    const url = `/internal/publishing/records`
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

  async getPublishRecordInfo(recordId: string) {
    const url = `/internal/publishing/records/${recordId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async getPublishRecordByDataId(dataId: string, uid: string) {
    const url = `/internal/${uid}/publishing/records/${dataId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    const res = await this.request<PublishRecord>(
      url,
      config,
    )
    return res
  }

  async completePublishTask(filter: { dataId: string, uid: string }, data: {
    workLink?: string
    dataOption?: any
  }) {
    const url = `/internal/${filter.uid}/publishing/records/${filter.dataId}`
    const config: AxiosRequestConfig = {
      method: 'PATCH',
      data,
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }

  async updatePublishRecordStatus(id: string, status: PublishStatus, errorMsg?: string) {
    const url = `/internal/publishing/records/${id}/status`
    const config: AxiosRequestConfig = {
      method: 'PATCH',
      data: {
        status,
        errorMsg,
      },
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }
}
