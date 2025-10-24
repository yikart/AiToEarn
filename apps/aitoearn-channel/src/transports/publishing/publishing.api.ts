import { Injectable, Logger } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { PublishRecord, PublishStatus } from '../account/common'
import { InternalApi } from '../api'

@Injectable()
export class PublishingInternalApi extends InternalApi {
  override logger = new Logger(PublishingInternalApi.name)

  constructor() {
    super()
  }

  /**
   * 创建账户
   * @param account
   * @param data
   * @returns
   */
  async createPublishRecord(
    data: Partial<PublishRecord>,
  ) {
    const url = `/api/internal/publishing/records`
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
    const url = `/api/internal/publishing/records/${recordId}`
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
    const url = `/api/internal/${uid}/publishing/records/${dataId}`
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
    const url = `/api/internal/${filter.uid}/publishing/records/${filter.dataId}`
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
    const url = `/api/internal/publishing/records/${id}/status`
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
