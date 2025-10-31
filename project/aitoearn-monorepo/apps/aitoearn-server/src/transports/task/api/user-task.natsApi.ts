import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../../taskBase.api'
import { UserTask } from './common'

@Injectable()
export class UserTaskNatsApi extends TaskBaseApi {
  /**
   * 获取用户任务信息
   * @param id 任务id
   * @returns 信息
   */
  async getUserTaskInfo(id: string) {
    const res = await this.sendMessage<UserTask>(
      `task/userTask/info`,
      {
        id,
      },
    )
    return res
  }
}
