import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { TableDto } from '@yikart/common'
import { UserTaskQueryFilterDto } from './user-task.dto'
import { UserTaskService } from './user-task.service'

@ApiTags('task/userTask - 用户任务')
@Controller('task/userTask')
export class UserTaskController {
  constructor(private readonly userTaskService: UserTaskService) {}

  @ApiOperation({ summary: '获取用户任务列表' })
  @Get('list/:pageNo/:pageSize')
  async getUserTaskList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: UserTaskQueryFilterDto,
  ) {
    const result = await this.userTaskService.getUserTaskList(param, {
      ...query,
      userId: token.id,
    })
    return result
  }

  @ApiOperation({ summary: '获取用户任务详情' })
  @Get('info/:id')
  async getUserTaskById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const result = await this.userTaskService.getUserTaskDetail(token.id, id)
    return result
  }
}
