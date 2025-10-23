import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AppException, TableDto } from '@yikart/common'
import {
  CreateTaskPunishDto,
  QueryTaskPunishFilterDto,
} from './taskPunish.dto'
import { TaskPunishService } from './taskPunish.service'

@ApiTags('任务惩罚')
@Controller('taskPunish')
export class TaskPunishController {
  constructor(private readonly taskPunishService: TaskPunishService) { }

  @Post()
  async create(@Body() data: CreateTaskPunishDto) {
    const res = await this.taskPunishService.create(data)
    return res
  }

  @Get('info/:id')
  async info(@Param() data: { id: string }) {
    const res = await this.taskPunishService.findById(data.id)
    if (!res) {
      throw new AppException(1000, '任务不存在')
    }
    return res
  }

  @Delete(':id')
  async delete(@Param() data: { id: string }) {
    await this.taskPunishService.delete(data.id)
  }

  @Get('list/:pageNo/:pageSize')
  async list(
    @Param() page: TableDto,
    @Query() query: QueryTaskPunishFilterDto,
  ) {
    const res = await this.taskPunishService.getList({ page, filter: query })
    return res
  }
}
