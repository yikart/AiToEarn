import { Injectable } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { InteractionRecord, InteractionRecordRepository } from '@yikart/channel-db'
import { TableDto } from '@yikart/common'
import { AddInteractionRecordDto } from './interaction-record.dto'

@Injectable()
export class InteractionRecordService {
  constructor(
    private readonly interactionRecordRepository: InteractionRecordRepository,
  ) {}

  async create(data: AddInteractionRecordDto): Promise<InteractionRecord> {
    return this.interactionRecordRepository.add(data)
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
    list: InteractionRecord[]
  }> {
    return this.interactionRecordRepository.getList(filters, page)
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    return this.interactionRecordRepository.delete(id)
  }
}
