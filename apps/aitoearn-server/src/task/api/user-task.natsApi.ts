import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { config } from '../../config'
import { UserTask } from './common'

@Injectable()
export class UserTaskNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  /**
   * 获取用户任务列表
   * @param page 分页
   * @param filter 筛选
   * @returns 用户任务列表
   */
  async getUserTaskList(page: TableDto, filter: { userId: string, status?: string }) {
    const res = await this.httpService.axiosRef.post<any[]>(
      `${config.task.baseUrl}/task/userTask/list`,
      {
        page,
        filter,
      },
    )
    return res.data
  }

  /**
   * 获取用户任务信息
   * @param id 任务id
   * @returns 信息
   */
  async getUserTaskInfo(id: string) {
    const res = await this.httpService.axiosRef.post<UserTask>(
      `${config.task.baseUrl}/task/userTask/info`,
      {
        id,
      },
    )
    return res.data
  }

  /**
   * 获取用户任务信息
   * @param id 任务id
   * @param userId 用户id
   * @returns 信息
   */
  async getUserTaskDetail(id: string, userId: string) {
    const res = await this.httpService.axiosRef.post<UserTask>(
      `${config.task.baseUrl}/task/userTask/detail`,
      {
        id,
        userId,
      },
    )
    return res.data
  }
}
