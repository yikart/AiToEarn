import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UserTaskApi } from '../../../transports/task/user-task.api'
import { UserTaskListQueryDto } from './user-task.dto'

@Injectable()
export class UserTaskService {
  constructor(private readonly userTaskApi: UserTaskApi) {}

  async getList(page: TableDto, filter: UserTaskListQueryDto) {
    return await this.userTaskApi.getList({ page, filter })
  }

  async getById(id: string) {
    return await this.userTaskApi.getById(id)
  }

  async verifyApproved(id: string, userId: string, screenshotUrls?: string[]) {
    return this.userTaskApi.verifyApproved(id, userId, screenshotUrls)
  }

  async verifyRejected(data: {
    id: string
    rejectionReason?: string
    verifierUserId?: string
    verificationNote?: string
  }) {
    return this.userTaskApi.verifyRejected(data)
  }

  async rollbackApproved(data: {
    id: string
    rejectionReason?: string
    verifierUserId?: string
    verificationNote?: string
  }) {
    return this.userTaskApi.rollbackApproved(data)
  }
}
