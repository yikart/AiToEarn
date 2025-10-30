import { Injectable, Logger } from '@nestjs/common'
import { AccountType, PublishRecord, PublishStatus } from '@yikart/mongodb'
import {
  GetPublishRecordDetailDto,
} from '../../publishRecord/dto/publish.dto'
import { PublishRecordService } from '../../publishRecord/publishRecord.service'

@Injectable()
export class PublishingInternalService {
  private readonly logger = new Logger(PublishingInternalService.name)
  constructor(
    private readonly publishingService: PublishRecordService,
  ) { }

  async createPublishRecord(data: Partial<PublishRecord>) {
    return await this.publishingService.createPublishRecord(data)
  }

  async getPublishRecordInfo(id: string) {
    return this.publishingService.getPublishRecordInfo(id)
  }

  async getPublishRecordByDataId(accountType: AccountType, dataId: string) {
    return this.publishingService.getPublishRecordByDataId(accountType, dataId)
  }

  async getPublishRecordDetail(data: GetPublishRecordDetailDto) {
    const publishRecord = await this.publishingService.getPublishRecordInfo(data.flowId)
    return publishRecord
  }

  async getPublishRecordByTaskId(taskId: string, userId: string) {
    const res = await this.publishingService.getPublishRecordByTaskId(taskId, userId)
    return res
  }

  async completePublishTask(
    filter: { dataId: string, uid: string },
    data: {
      workLink?: string
      dataOption?: unknown
    },
  ): Promise<boolean> {
    return this.publishingService.donePublishRecord(
      filter,
      data,
    )
  }

  async updatePublishRecordStatus(id: string, status: PublishStatus, errorMsg?: string) {
    return this.publishingService.updatePublishRecordStatus(id, status, errorMsg)
  }
}
