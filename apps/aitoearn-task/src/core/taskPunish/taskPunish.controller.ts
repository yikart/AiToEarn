import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import {
  CreateTaskPunishDto,
  QueryTaskPunishDto,
  UpdateTaskPunishDto,
} from './taskPunish.dto'
import { TaskPunishService } from './taskPunish.service'

@ApiTags('任务惩罚')
@Controller()
export class TaskPunishController {
  constructor(private readonly taskPunishService: TaskPunishService) {}

  // @NatsMessagePattern('task.admin.taskPunish.create')
  @Post('task/admin/taskPunish/create')
  async create(@Body() data: CreateTaskPunishDto) {
    const res = await this.taskPunishService.create(data)
    return res
  }

  // @NatsMessagePattern('task.admin.taskPunish.info')
  @Post('task/admin/taskPunish/info')
  async info(@Body() data: { id: string }) {
    const res = await this.taskPunishService.findById(data.id)
    if (!res) {
      throw new AppException(1000, 'The task does not exist.')
    }
    return res
  }

  // @NatsMessagePattern('task.admin.taskPunish.update')
  @Post('task/admin/taskPunish/update')
  async update(
    @Body() data: UpdateTaskPunishDto,
  ) {
    const res = await this.taskPunishService.update(data)
    if (!res) {
      throw new AppException(1000, 'The task does not exist.')
    }
    return res
  }

  // @NatsMessagePattern('task.admin.taskPunish.delete')
  @Post('task/admin/taskPunish/delete')
  async delete(@Body() data: { id: string }) {
    await this.taskPunishService.delete(data.id)
  }

  // @NatsMessagePattern('task.admin.taskPunish.list')
  @Post('task/admin/taskPunish/list')
  async list(@Body() query: QueryTaskPunishDto) {
    const res = await this.taskPunishService.getList(query)
    return res
  }
}
