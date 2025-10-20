import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'
import { TaskOpportunity } from './common'
import { TaskWithOpportunityDetail, TotalAmountResult, UserTaskDetail } from './task.interface'

@Injectable()
export class TaskNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getTaskOpportunityList(page: { pageNo: number, pageSize: number }, userId: string): Promise<TaskWithOpportunityDetail> {
    const res = await this.httpService.axiosRef.post<TaskWithOpportunityDetail>(
      `${config.task.baseUrl}/task/taskOpportunity/list`,
      {
        page,
        filter: { userId },
      },
    )
    return res.data
  }

  async getTaskInfoByOpportunityId(opportunityId: string): Promise<TaskWithOpportunityDetail> {
    const res = await this.httpService.axiosRef.post<TaskWithOpportunityDetail>(
      `${config.task.baseUrl}/task/task/infoByOpportunityId`,
      {
        opportunityId,
      },
    )
    return res.data
  }

  async doView(userId: string, id: string) {
    const res = await this.httpService.axiosRef.post<TaskOpportunity>(
      `${config.task.baseUrl}/task/taskOpportunity/doView`,
      {
        userId,
        id,
      },
    )
    return res.data
  }

  async doViewAll(userId: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.task.baseUrl}/task/taskOpportunity/doViewAll`,
      {
        userId,
      },
    )
    return res.data
  }

  async getNotViewCount(userId: string) {
    const res = await this.httpService.axiosRef.post<number>(
      `${config.task.baseUrl}/task/taskOpportunity/notViewCount`,
      {
        userId,
      },
    )
    return res.data
  }

  async getTotalRewardAmount(userId: string): Promise<TotalAmountResult> {
    const res = await this.httpService.axiosRef.post<TotalAmountResult>(
      `${config.task.baseUrl}/task/task/rewardAmount`,
      {
        userId,
      },
    )
    return res.data
  }

  async acceptTask(acceptTaskData: {
    opportunityId: string
    userId: string
    accountId?: string
  }): Promise<UserTaskDetail> {
    const res = await this.httpService.axiosRef.post<UserTaskDetail>(
      `${config.task.baseUrl}/task/userTask/accept`,
      acceptTaskData,
    )
    return res.data
  }

  async submitTask(
    userTaskId: string,
    userId: string,
    materialId?: string,
  ): Promise<UserTaskDetail> {
    const res = await this.httpService.axiosRef.post<UserTaskDetail>(
      `${config.task.baseUrl}/task/userTask/submit`,
      { id: userTaskId, userId, materialId },
    )
    return res.data
  }
}
