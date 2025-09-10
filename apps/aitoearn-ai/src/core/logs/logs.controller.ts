import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { LogDetailQueryDto, LogListQueryDto } from './logs.dto'
import { LogsService } from './logs.service'
import { LogDetailResponseVo, LogListResponseVo } from './logs.vo'

@Controller('/logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  @NatsMessagePattern('ai.logs.list')
  async getLogList(@Payload() query: LogListQueryDto): Promise<LogListResponseVo> {
    const [list, total] = await this.logsService.getLogList(query)
    return new LogListResponseVo(list, total, query)
  }

  @NatsMessagePattern('ai.logs.detail')
  async getLogDetail(@Payload() query: LogDetailQueryDto): Promise<LogDetailResponseVo> {
    const response = await this.logsService.getLogDetail(query)
    return LogDetailResponseVo.create(response)
  }
}
