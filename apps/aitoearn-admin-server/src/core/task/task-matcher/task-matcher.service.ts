import { Injectable } from '@nestjs/common'
import { TaskMatcherApi } from '../../../transports/task/task-matcher.api'
import {
  CreateTaskMatcherDto,
  QueryTaskMatcherDto,
  UpdateTaskMatcherDto,
} from './task-matcher.dto'
import { TaskMatcherListVo, TaskMatcherVo } from './task-matcher.vo'

@Injectable()
export class TaskMatcherService {
  constructor(private readonly taskMatcherApi: TaskMatcherApi) {}

  async create(createDto: CreateTaskMatcherDto): Promise<TaskMatcherVo> {
    return await this.taskMatcherApi.create(createDto)
  }

  async getById(id: string): Promise<TaskMatcherVo> {
    return await this.taskMatcherApi.getById({ id })
  }

  async update(id: string, updateDto: UpdateTaskMatcherDto): Promise<TaskMatcherVo> {
    return await this.taskMatcherApi.update(id, updateDto)
  }

  async delete(id: string) {
    return await this.taskMatcherApi.delete({ id })
  }

  async getList(query: QueryTaskMatcherDto): Promise<TaskMatcherListVo> {
    return await this.taskMatcherApi.list(query)
  }
}
