import type {
  CreateInteractionRecordParams,
  DeleteInteractionRecordParams,
  ListInteractionRecordsParams,
} from './interaction-mcp.schema'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { InteractionRecordService } from './interaction-record.service'

@Injectable()
export class InteractionMcpService {
  constructor(
    private readonly interactionRecordService: InteractionRecordService,
  ) {}

  async createInteractionRecord(userId: string, params: CreateInteractionRecordParams) {
    const record = await this.interactionRecordService.create({
      ...params,
      userId,
      type: params.platform,
    })

    return `Interaction record created: id=${record.id}`
  }

  async listInteractionRecords(userId: string, params: ListInteractionRecordsParams) {
    const result = await this.interactionRecordService.getList(
      { userId },
      {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
      } as TableDto,
    )

    return {
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      totalPages: Math.ceil(result.total / params.pageSize),
      total: result.total,
      list: result.list.map(item => ({
        id: item.id,
        accountId: item.accountId,
        platform: item.type,
        worksId: item.worksId,
        worksTitle: item.worksTitle,
        worksCover: item.worksCover,
        worksContent: item.worksContent,
        commentContent: item.commentContent,
        commentRemark: item.commentRemark,
        commentTime: item.commentTime,
        likeTime: item.likeTime,
        collectTime: item.collectTime,
        createdAt: item.createdAt,
      })),
    }
  }

  async deleteInteractionRecord(userId: string, params: DeleteInteractionRecordParams) {
    const record = await this.interactionRecordService.getById(params.id)
    if (!record || record.userId !== userId) {
      throw new AppException(ResponseCode.InteractRecordNotFound)
    }

    await this.interactionRecordService.delete(params.id)

    return `Interaction record deleted: id=${params.id}`
  }
}
