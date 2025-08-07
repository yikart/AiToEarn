import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { AcceptTaskDto } from './task.dto'
import { TaskService } from './task.service'
import { TaskVo, TotalAmountVo, UserTaskVo } from './task.vo'

@ApiTags('task - 任务')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: '获取任务信息' })
  @Get(':id')
  async getTaskInfo(@Param('id') id: string): Promise<TaskVo> {
    const result = await this.taskService.getTaskInfo(id)
    return TaskVo.create(result)
  }

  @ApiOperation({ summary: '获取进行中任务的金额总数' })
  @Get('reward-amount')
  async getTotalRewardAmount(
    @GetToken() token: TokenInfo,
  ): Promise<TotalAmountVo> {
    const result = await this.taskService.getTotalRewardAmount(token.id)
    return TotalAmountVo.create(result)
  }

  @ApiOperation({ summary: '用户接取任务' })
  @Post('accept')
  async acceptTask(
    @GetToken() token: TokenInfo,
    @Body() acceptTaskDto: AcceptTaskDto,
  ): Promise<UserTaskVo> {
    const result = await this.taskService.acceptTask(token.id, acceptTaskDto)
    return UserTaskVo.create(result)
  }
}
