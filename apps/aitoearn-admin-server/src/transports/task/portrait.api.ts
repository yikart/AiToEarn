import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { User, UserStatus } from '@yikart/mongodb'
import { TaskBaseApi } from '../taskBase.api'
import {
  Task,
} from './task.interface'

@Injectable()
export class PortraitApi extends TaskBaseApi {
  async getAccountPortraitList(
    page: TableDto,
    filter: {
      keyword?: string
      taskId?: string
      rule?: unknown
    },
  ): Promise<{ list: Task[], total: number }> {
    return await this.sendMessage<{ list: Task[], total: number }>(
      'task/accountPortrait/list',
      { page, filter },
    )
  }

  async getAccountPortraitById(id: string): Promise<Task> {
    return await this.sendMessage<Task>(
      'task/accountPortrait/get',
      { id },
    )
  }

  async getUserPortraitList(
    page: TableDto,
    filter: {
      keyword?: string
      time?: string[]
    },
  ): Promise<{ list: Task[], total: number }> {
    return await this.sendMessage<{ list: Task[], total: number }>(
      'task/userPortrait/list',
      { page, filter },
    )
  }

  async getUserPortraitById(userId: string): Promise<Task> {
    return await this.sendMessage<Task>(
      'task/userPortrait/get',
      { userId },
    )
  }

  userPortraitReport(user: User) {
    return this.sendMessage<void>(
      'task/userPortrait/report',
      {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        status: UserStatus.OPEN,
        lastLoginTime: new Date(),
      },
    )
  }
}
