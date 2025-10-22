import { Body, Controller, Post } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import {
  CreateTaskMatcherDto,
  QueryTaskMatcherDto,
  UpdateTaskMatcherDto,
} from './task-matcher.dto'
import { TaskMatcherService } from './task-matcher.service'
import { TaskMatcherListVo, TaskMatcherVo } from './task-matcher.vo'

@ApiTags('matcher - 任务匹配规则')
@Controller('matcher')
export class TaskMatcherController {
  constructor(private readonly taskMatcherService: TaskMatcherService) {}

  // @NatsMessagePattern('task.admin.matcher.create')
  @Post('create')
  async create(@Body() createDto: CreateTaskMatcherDto): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.create(createDto)
    return matcher
  }

  // @NatsMessagePattern('task.admin.matcher.get')
  @Post('get')
  async get(@Payload() data: { id: string }): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.findById(data.id)
    if (!matcher) {
      throw new AppException(1000, '任务匹配规则不存在')
    }
    return matcher
  }

  // @NatsMessagePattern('task.admin.matcher.update')
  @Post('update')
  async update(
    @Body() data: UpdateTaskMatcherDto,
  ): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.update(data)
    if (!matcher) {
      throw new AppException(1000, '任务匹配规则不存在')
    }
    return matcher
  }

  // @NatsMessagePattern('task.admin.matcher.delete')
  @Post('delete')
  async delete(@Body() data: { id: string }) {
    await this.taskMatcherService.delete(data.id)
  }

  // @NatsMessagePattern('task.admin.matcher.list')
  @Post('list')
  async list(@Body() query: QueryTaskMatcherDto): Promise<TaskMatcherListVo> {
    const result = await this.taskMatcherService.getList(query)
    return TaskMatcherListVo.create(result)
  }
}
