import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class UserTaskNatsApi extends BaseNatsApi {
  /**
   * 获取用户任务列表
   * @param userId 用户ID
   * @param status 任务状态（可选）
   * @returns 用户任务列表
   */
  async getUserTaskList(userId: string, status?: string) {
    return await this.sendMessage(NatsApi.user.task.list, {
      userId,
      status,
    })
  }
}
