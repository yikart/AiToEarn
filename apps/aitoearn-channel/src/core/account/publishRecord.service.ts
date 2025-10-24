import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { PublishRecord, PublishStatus } from '../../transports/account/common'
import { PublishingInternalApi } from '../../transports/publishing/publishing.api'

@Injectable()
export class PublishRecordService {
  constructor(
    readonly publishingInternalApi: PublishingInternalApi,
  ) {}

  // 创建
  @OnEvent('publishRecord.create', { async: true })
  async createPublishRecord(data: Partial<PublishRecord>) {
    return this.publishingInternalApi.createPublishRecord(data)
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.publishingInternalApi.getPublishRecordInfo(id)
  }

  async getPublishRecordByDataId(dataId: string, uid: string) {
    return this.publishingInternalApi.getPublishRecordByDataId(dataId, uid)
  }

  // 完成发布记录
  async donePublishRecord(
    filter: { dataId: string, uid: string },
    data: {
      workLink?: string
      dataOption?: any
    },
  ) {
    const res = await this.publishingInternalApi.completePublishTask(filter, data)
    return res
  }

  async updatePublishRecordStatus(id: string, status: PublishStatus, errorMsg?: string) {
    return this.publishingInternalApi.updatePublishRecordStatus(id, status, errorMsg)
  }
}
