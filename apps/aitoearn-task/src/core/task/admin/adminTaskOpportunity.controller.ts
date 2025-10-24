import { Body, Controller, Logger, Post } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { TaskOpportunityStatus } from '@yikart/task-db'
import { AdminTaskOpportunityListDto } from './adminTaskOpportunity.dto'
import { AdminTaskOpportunityService } from './adminTaskOpportunity.service'

@Controller('')
export class AdminTaskOpportunityController {
  logger = new Logger(AdminTaskOpportunityController.name)
  constructor(
    private readonly taskOpportunityService: AdminTaskOpportunityService,
  ) {}

  // @NatsMessagePattern('task.admin.taskOpportunity.list')
  @Post('task/admin/taskOpportunity/list')
  async taskOpportunityList(@Body() data: AdminTaskOpportunityListDto) {
    return this.taskOpportunityService.findList(data.page, data.filter)
  }

  // @NatsMessagePattern('task.admin.taskOpportunity.del')
  @Post('task/admin/taskOpportunity/del')
  async delTaskOpportunity(@Body() data: { id: string }) {
    const info = await this.taskOpportunityService.info(data.id)
    if (!info || info.status !== TaskOpportunityStatus.PENDING) {
      throw new AppException(1433, 'The task has been accepted or does not exist and cannot be deleted')
    }
    return this.taskOpportunityService.delete(data.id)
  }
}
