import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { LogListQueryDto, logListQuerySchema } from './logs.dto'
import { LogsService } from './logs.service'
import { LogsListResponseVo } from './logs.vo'

@ApiTags('Me/Ai/Logs')
@Controller('/ai/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @ApiDoc({
    summary: '获取用户 AI 活动日志',
    query: logListQuerySchema,
    response: LogsListResponseVo,
  })
  @Get('/')
  async getLogs(
    @GetToken() token: TokenInfo,
    @Query() query: LogListQueryDto,
  ): Promise<LogsListResponseVo> {
    const [list, total] = await this.logsService.getLogList({
      userId: token.id,
      userType: UserType.User,
      ...query,
    })
    return new LogsListResponseVo(list, total, query)
  }
}
