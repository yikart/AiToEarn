import { Injectable } from '@nestjs/common'
import { UserTaskNatsApi } from '../transports/task/api/user-task.natsApi'

@Injectable()
export class UserTaskService {
  constructor(
    private readonly userTaskNatsApi: UserTaskNatsApi,
  ) { }

  /**
   * 获取用户任务详情
   * @param data
   */
  async getUserTaskInfo(
    id: string,
  ) {
    return this.userTaskNatsApi.getUserTaskInfo(id)
  }
}
