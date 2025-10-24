import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { InternalApi } from '../api'
import { Task } from './common'

@Injectable()
export class TaskInternalApi extends InternalApi {
  /**
   * 获取任务信息
   * @param taskId 任务id
   * @returns 用户信息
   */
  async getTaskInfo(taskId: string) {
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
