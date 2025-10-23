import { Injectable } from '@nestjs/common'
import { CreateTaskPunishDto, QueryTaskPunishDto } from '../../core/task/taskPunish/taskPunish.dto'
import { TaskBaseApi } from '../taskBase.api'
import { TaskPunish } from './task.interface'

@Injectable()
export class TaskPunishApi extends TaskBaseApi {
  async create(data: CreateTaskPunishDto) {
    return await this.sendMessage<TaskPunish>(
      'task/admin/taskPunish/create',
      data,
    )
  }

  async getById(id: string) {
    return await this.sendMessage<TaskPunish>(
      'task/admin/taskPunish/info',
      { id },
    )
  }

  async delete(id: string) {
    return await this.sendMessage(
      'task/admin/taskPunish/delete',
      { id },
    )
  }

  async list(query: QueryTaskPunishDto) {
    return await this.sendMessage<any>(
      'task/admin/taskPunish/list',
      query,
    )
  }
}
