import { Injectable } from '@nestjs/common'
import { TaskBaseApi } from '../taskBase.api'
import { UserTask, UserTaskListRequest } from './task.interface'

@Injectable()
export class UserTaskApi extends TaskBaseApi {
  async getList(request: UserTaskListRequest): Promise<{ list: UserTask[], total: number }> {
    return await this.sendMessage<{ list: UserTask[], total: number }>(
      'task/admin/userTask/list',
      request,
    )
  }

  async getById(id: string): Promise<UserTask> {
    return await this.sendMessage<UserTask>(
      'task/admin/userTask/info',
      { id },
    )
  }

  async verifyApproved(id: string, userId: string, screenshotUrls?: string[]) {
    return await this.sendMessage<{ success: boolean }>(
      'task/admin/userTask/verifyApproved',
      { id, userId, screenshotUrls },
    )
  }

  /**
   * 拒绝
   * @param data
   * @returns
   */
  async verifyRejected(data: {
    id: string
    rejectionReason?: string
    verifierUserId?: string
    verificationNote?: string
  }) {
    return await this.sendMessage<{ success: boolean }>(
      'task/admin/userTask/verifyRejected',
      data,
    )
  }

  async rollbackApproved(data: {
    id: string
    rejectionReason?: string
    verifierUserId?: string
    verificationNote?: string
  }) {
    return await this.sendMessage<{ success: boolean }>(
      'task/admin/userTask/rollbackApproved',
      data,
    )
  }
}
