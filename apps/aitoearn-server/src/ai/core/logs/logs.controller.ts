import { Body, Controller, Post } from '@nestjs/common'
import { LogListResponseVo } from '../../ai.vo'
import { LogDetailQueryDto, LogListQueryDto } from './logs.dto'
import { LogsService } from './logs.service'
import { LogDetailResponseVo } from './logs.vo'

@Controller('/logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  // @NatsMessagePattern('ai.logs.list')
  @Post('ai/logs/list')
  async getLogList(@Body() query: LogListQueryDto): Promise<LogListResponseVo> {
    const [list, total] = await this.logsService.getLogList(query)
    return new LogListResponseVo(list, total, query)
  }

  // @NatsMessagePattern('ai.logs.detail')
  @Post('ai/logs/detail')
  async getLogDetail(@Body() query: LogDetailQueryDto): Promise<LogDetailResponseVo> {
    const response = await this.logsService.getLogDetail(query)
    return LogDetailResponseVo.create(response)
  }
}
