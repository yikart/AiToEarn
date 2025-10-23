import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  CreateTaskMatcherDto,
  QueryTaskMatcherDto,
  UpdateTaskMatcherDto,
} from './task-matcher.dto'
import { TaskMatcherService } from './task-matcher.service'
import { TaskMatcherListVo, TaskMatcherVo } from './task-matcher.vo'

@ApiTags('task-matcher - 任务匹配规则')
@Controller('task-matcher')
export class TaskMatcherController {
  constructor(private readonly taskMatcherService: TaskMatcherService) {}

  @ApiOperation({ summary: '创建任务匹配规则' })
  @Post()
  async create(@Body() createDto: CreateTaskMatcherDto): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.create(createDto)
    return matcher
  }

  @ApiOperation({ summary: '获取单个任务匹配规则' })
  @Get(':id')
  async get(@Param('id') id: string): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.getById(id)
    return matcher
  }

  @ApiOperation({ summary: '更新任务匹配规则' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskMatcherDto,
  ): Promise<TaskMatcherVo> {
    const matcher = await this.taskMatcherService.update(
      id,
      updateDto,
    )
    return matcher
  }

  @ApiOperation({ summary: '删除任务匹配规则' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.taskMatcherService.delete(id)
  }

  @ApiOperation({ summary: '获取任务匹配规则列表' })
  @Get()
  async list(@Query() query: QueryTaskMatcherDto): Promise<TaskMatcherListVo> {
    const result = await this.taskMatcherService.getList(query)
    return result
  }
}
