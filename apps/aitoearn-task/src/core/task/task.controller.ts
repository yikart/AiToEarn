import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import { OpportunityIdDto, TaskIdDto } from './task.dto'
import { TaskService } from './task.service'

@ApiTags('task - 任务')
@Controller('task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
  ) {}

  // @NatsMessagePattern('task.task.info')
  @Post('info')
  async findOne(@Body() data: TaskIdDto) {
    const task = await this.taskService.findOne(data.id)
    if (!task) {
      throw new AppException(1000, '任务不存在')
    }
    return task
  }

  // @ApiOperation({ summary: '根据opportunityId获取任务信息' })
  // @NatsMessagePattern('task.task.infoByOpportunityId')
  @Post('infoByOpportunityId')
  async findOneByOpportunity(@Body() data: OpportunityIdDto) {
    const result = await this.taskService.getTaskWithOpportunity(data.opportunityId)
    return result
  }
}
