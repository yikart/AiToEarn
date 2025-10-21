import { Injectable } from '@nestjs/common'
import { AccountType, TaskRepository } from '@yikart/statistics-db'

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) { }

  // 用户任务作品记录
  async userTaskPosts(accountId: string, type: AccountType, uid: string, taskId: string, postId: string) {
    return this.taskRepository.userTaskPosts(accountId, type, uid, taskId, postId)
  }

  // 根据taskId 查询 作品信息
  async getTaskPostsByTaskId(taskId: string) {
    return this.taskRepository.getTaskPostsByTaskId(taskId)
  }

  /**
   * 根据任务ID获取作品数据并汇总统计
   * @param taskId 任务ID
   * @returns 汇总统计结果
   */
  async getTaskPostsSummary(taskId: string) {
    return this.taskRepository.getTaskPostsSummary(taskId)
  }
}
