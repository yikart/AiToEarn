import { Injectable } from '@nestjs/common'
import { UserTaskNatsApi } from '@transports/task/user-task.natsApi'

@Injectable()
export class UserTaskService {
  constructor(private readonly userTaskNatsApi: UserTaskNatsApi) {}

  async getUserTaskList(userId: string, status?: string) {
    return await this.userTaskNatsApi.getUserTaskList(userId, status)
  }
}
