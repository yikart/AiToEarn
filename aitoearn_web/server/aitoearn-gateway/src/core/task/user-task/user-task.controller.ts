import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { UserTaskService } from './user-task.service'
import { UserTaskVo, UserTaskWithTaskVo } from './user-task.vo'

@ApiTags('task/user-task - 用户任务')
@Controller('task/user-task')
export class UserTaskController {
  constructor(private readonly userTaskService: UserTaskService) {}

  @ApiOperation({ summary: '获取用户任务列表' })
  @Get()
  async getUserTaskList(
    @GetToken() token: TokenInfo,
    @Query('status') status?: string,
  ): Promise<UserTaskVo[]> {
    const result = await this.userTaskService.getUserTaskList(token.id, status)
    return result.map(item => UserTaskVo.create(item))
  }

  @ApiOperation({ summary: '获取用户任务详情' })
  @Get('/:id')
  async getUserTaskById(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ): Promise<UserTaskWithTaskVo> {
    const result = await this.userTaskService.getUserTask(token.id, id)
    return UserTaskWithTaskVo.create(result)
  }
}
