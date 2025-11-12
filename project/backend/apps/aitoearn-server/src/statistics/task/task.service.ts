import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountType } from '@yikart/common'
import { TaskRepository } from '@yikart/statistics-db'

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) { }

  // User task post record
  @OnEvent('statistics.task.userTaskPosts')
  async userTaskPosts(data: { accountId: string, type: AccountType, uid: string, taskId: string, postId: string }) {
    return this.taskRepository.userTaskPosts(data.accountId, data.type, data.uid, data.taskId, data.postId)
  }

  // Query post information by taskId
  async getTaskPostsByTaskId(taskId: string) {
    return this.taskRepository.getTaskPostsByTaskId(taskId)
  }

  /**
   * Get post data by task ID and compute summary
   * @param taskId Task ID
   * @returns Summary statistics result
   */
  async getTaskPostsSummary(taskId: string) {
    return this.taskRepository.getTaskPostsSummary(taskId)
  }
}
