import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UserTaskNatsApi } from '../../transports/task/api/user-task.natsApi'

@Injectable()
export class UserTaskService {
  constructor(private readonly userTaskNatsApi: UserTaskNatsApi) {}

  async getUserTaskList(page: TableDto, filter: { userId: string, status?: string }) {
    return await this.userTaskNatsApi.getUserTaskList(page, filter)
  }

  async getUserTaskDetail(userId: string, id: string) {
    return await this.userTaskNatsApi.getUserTaskDetail(id, userId)
  }
}
