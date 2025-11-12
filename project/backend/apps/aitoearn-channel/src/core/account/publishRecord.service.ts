import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AitoearnServerClientService, PublishRecord, PublishStatus } from '@yikart/aitoearn-server-client'

@Injectable()
export class PublishRecordService {
  constructor(
    private readonly serverClient: AitoearnServerClientService,
  ) {}

  // 创建
  @OnEvent('publishRecord.create', { async: true })
  async createPublishRecord(data: Partial<PublishRecord>) {
    return this.serverClient.publishing.createPublishRecord(data)
  }

  // 获取发布记录信息
  async getPublishRecordInfo(id: string) {
    return this.serverClient.publishing.getPublishRecordInfo(id)
  }

  async getPublishRecordByDataId(dataId: string, uid: string) {
    return this.serverClient.publishing.getPublishRecordByDataId(dataId, uid)
  }

  // 完成发布记录
  async donePublishRecord(
    filter: { dataId: string, uid: string },
    data: {
      workLink?: string
      dataOption?: any
    },
  ) {
    const res = await this.serverClient.publishing.completePublishTask(filter, data)
    return res
  }

  async updatePublishRecordStatus(id: string, status: PublishStatus, errorMsg?: string) {
    return this.serverClient.publishing.updatePublishRecordStatus(id, status, errorMsg)
  }
}
