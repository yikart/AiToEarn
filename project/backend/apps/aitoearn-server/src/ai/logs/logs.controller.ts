import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { LogListQueryDto } from './logs.dto'
import { LogsService } from './logs.service'
import { LogsListResponseVo } from './logs.vo'

@ApiTags('OpenSource/Me/Ai')
@Controller('ai')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @ApiDoc({
    summary: 'Get User AI Activity Logs',
    query: LogListQueryDto.schema,
    response: LogsListResponseVo,
  })
  @Get('/logs')
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
