import { Injectable } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { ReplyCommentRecord, ReplyCommentRecordRepository } from '@yikart/channel-db'
import { TableDto } from '@yikart/common'
import { AddReplyCommentRecordDto } from './reply-comment-record.dto'

@Injectable()
export class ReplyCommentRecordService {
  constructor(
    private readonly replyCommentRecordRepository: ReplyCommentRecordRepository,
  ) {}

  async create(data: AddReplyCommentRecordDto): Promise<ReplyCommentRecord> {
    return this.replyCommentRecordRepository.add(data)
  }

  async getList(
    filters: {
      userId: string
      accountId?: string
      type?: AccountType
      worksId?: string
      time?: [Date?, Date?, ...unknown[]]
    },
    page: TableDto,
  ): Promise<{
    total: number
    list: ReplyCommentRecord[]
  }> {
    return await this.replyCommentRecordRepository.getList(filters, page)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.replyCommentRecordRepository.delete(id)
    return result.deleted
  }
}
