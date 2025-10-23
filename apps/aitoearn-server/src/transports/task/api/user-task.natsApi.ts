import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { TaskBaseApi } from '../../taskBase.api'
import { UserTask } from './common'

@Injectable()
export class UserTaskNatsApi extends TaskBaseApi {
  /**
   * 获取用户任务列表
   * @param page 分页
   * @param filter 筛选
   * @returns 用户任务列表
   */
  async getUserTaskList(page: TableDto, filter: { userId: string, status?: string }) {
    const res = await this.sendMessage<any[]>(
      `task/userTask/list`,
      {
        page,
        filter,
      },
    )
    return res
  }

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

  /**
   * 获取用户任务信息
   * @param id 任务id
   * @param userId 用户id
   * @returns 信息
   */
  async getUserTaskDetail(id: string, userId: string) {
    const res = await this.sendMessage<UserTask>(
      `task/userTask/detail`,
      {
        id,
        userId,
      },
    )
    return res
  }
}
