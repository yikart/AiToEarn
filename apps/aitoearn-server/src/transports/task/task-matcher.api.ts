import { Injectable } from '@nestjs/common'
import { CreateTaskMatcherDto, QueryTaskMatcherDto, UpdateTaskMatcherDto } from '../../core/task/task-matcher/task-matcher.dto'
import { TaskMatcherListVo, TaskMatcherVo } from '../../core/task/task-matcher/task-matcher.vo'
import { TaskBaseApi } from '../taskBase.api'

@Injectable()
export class TaskMatcherApi extends TaskBaseApi {
  async create(data: CreateTaskMatcherDto): Promise<TaskMatcherVo> {
    return await this.sendMessage<TaskMatcherVo>(
      'task/admin/matcher/create',
      data,
    )
  }

  async getById(data: { id: string }): Promise<TaskMatcherVo> {
    return await this.sendMessage<TaskMatcherVo>(
      'task/admin/matcher/get',
      data,
    )
  }

  async update(id: string, data: UpdateTaskMatcherDto): Promise<TaskMatcherVo> {
    return await this.sendMessage<TaskMatcherVo>(
      'task/admin/matcher/update',
      {
        id,
        ...data,
      },
    )
  }

  async delete(data: { id: string }) {
    return await this.sendMessage(
      'task/admin/matcher/delete',
      data,
    )
  }

  async list(query: QueryTaskMatcherDto): Promise<TaskMatcherListVo> {
    return await this.sendMessage<TaskMatcherListVo>(
      'task/admin/matcher/list',
      query,
    )
  }
}
