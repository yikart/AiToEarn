import { Injectable } from '@nestjs/common'
import { NatsApi } from '@transports/api'
import { NatsService } from '@transports/nats.service'

@Injectable()
export class UserTaskNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 获取用户任务列表
   * @param userId 用户ID
   * @param status 任务状态（可选）
   * @returns 用户任务列表
   */
  async getUserTaskList(userId: string, status?: string) {
    return await this.natsService.sendMessage(NatsApi.user.task.list, {
      userId,
      status,
    })
  }
}
