import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../../taskBase.api'
import { Task } from './common'

@Injectable()
export class TaskNatsApi extends TaskBaseApi {
  async getTaskInfo(taskId: string) {
    const res = await this.sendMessage<Task>(
      `task/task/info`,
      {
        id: taskId,
      },
    )
    return res
  }
}
