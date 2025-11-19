import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AiLogRepository } from '@yikart/mongodb'
import { LogDetailQueryDto, LogListQueryDto } from './logs.dto'

@Injectable()
export class LogsService {
  constructor(
    private readonly aiLogRepo: AiLogRepository,
  ) {}

  /**
   * 查询日志列表
   */
  async getLogList(query: LogListQueryDto) {
    return await this.aiLogRepo.listWithPagination(query)
  }

  /**
   * 查询日志详情
   */
  async getLogDetail({ id, userId, userType }: LogDetailQueryDto) {
    let log
    if (userId && userType) {
      log = await this.aiLogRepo.getByIdAndUserId(id, userId, userType)
    }
    else {
      log = await this.aiLogRepo.getById(id)
    }

    if (!log) {
      throw new AppException(ResponseCode.AiLogNotFound)
    }

    return log
  }
}
