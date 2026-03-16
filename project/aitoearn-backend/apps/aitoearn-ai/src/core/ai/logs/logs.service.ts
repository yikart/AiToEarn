import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { AiLogRepository, ListAiLogParams } from '@yikart/mongodb'

@Injectable()
export class LogsService {
  constructor(
    private readonly aiLogRepo: AiLogRepository,
  ) {}

  async getLogList(query: ListAiLogParams) {
    return await this.aiLogRepo.listWithPagination(query)
  }

  async getLogDetail(id: string, userId: string, userType: UserType) {
    const log = await this.aiLogRepo.getByIdAndUserId(id, userId, userType)

    if (!log) {
      throw new AppException(ResponseCode.AiLogNotFound)
    }

    return log
  }
}
