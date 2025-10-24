import { Body, Controller, Logger, Post } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { TaskOpportunityStatus } from '@yikart/task-db'
import { TaskOpportunityListDto } from './task.dto'
import { TaskOpportunityService } from './taskOpportunity.service'

@Controller()
export class TaskOpportunityController {
  logger = new Logger(TaskOpportunityController.name)
  constructor(
    private readonly taskOpportunityService: TaskOpportunityService,
  ) {}

  // @NatsMessagePattern('task.taskOpportunity.del')
  @Post('task/taskOpportunity/del')
  async delTaskOpportunity(@Body() data: { id: string }) {
    const info = await this.taskOpportunityService.findOneById(data.id)
    if (!info || info.status !== TaskOpportunityStatus.PENDING)
      throw new AppException(1000, 'The task does not exist.')
    return this.taskOpportunityService.delete(data.id)
  }

  // @NatsMessagePattern('task.taskOpportunity.list')
  @Post('task/taskOpportunity/list')
  async taskOpportunityList(@Body() data: TaskOpportunityListDto) {
    return this.taskOpportunityService.findList(data.page, data.filter)
  }

  // @NatsMessagePattern('task.taskOpportunity.doView')
  @Post('task/taskOpportunity/doView')
  async doView(@Body() data: { userId: string, id: string }) {
    return this.taskOpportunityService.doView(data.userId, data.id)
  }

  // @NatsMessagePattern('task.taskOpportunity.doViewAll')
  @Post('task/taskOpportunity/doViewAll')
  async doViewAll(@Body() data: { userId: string }) {
    return this.taskOpportunityService.doViewAll(data.userId)
  }

  // @NatsMessagePattern('task.taskOpportunity.notViewCount')
  @Post('task/taskOpportunity/notViewCount')
  async getNotViewCount(@Body() data: { userId: string }) {
    return this.taskOpportunityService.getNotViewCount(data.userId)
  }
}
