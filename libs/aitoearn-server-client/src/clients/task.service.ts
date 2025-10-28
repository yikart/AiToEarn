import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { Task } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class TaskService extends BaseService {
  /**
   * 获取任务信息
   * @param taskId 任务id
   * @returns 用户信息
   */
  async getTask(taskId: string) {
    const url = `/internal/tasks/${taskId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    const res = await this.request<Task>(
      url,
      config,
    )
    return res
  }
}
