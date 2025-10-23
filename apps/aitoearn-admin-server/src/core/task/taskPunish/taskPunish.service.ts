import { Injectable } from '@nestjs/common'
import { TaskPunishApi } from '../../../transports/task/taskPunish.api'
import {
  CreateTaskPunishDto,
  QueryTaskPunishDto,
} from './taskPunish.dto'

@Injectable()
export class TaskPunishService {
  constructor(private readonly taskPunishApi: TaskPunishApi) {}

  async create(data: CreateTaskPunishDto) {
    const res = await this.taskPunishApi.create(data)
    return res
  }

  async findById(id: string) {
    return await this.taskPunishApi.getById(id)
  }

  async delete(id: string) {
    await this.taskPunishApi.delete(id)
  }

  async getList(query: QueryTaskPunishDto) {
    const res = await this.taskPunishApi.list(query)
    return res
  }
}
