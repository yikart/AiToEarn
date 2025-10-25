import { Injectable } from '@nestjs/common'
import { PostRepository, TaskRepository } from '@yikart/statistics-db'

@Injectable()
export class TaskStatisticsService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly postRepository: PostRepository,
  ) { }

  // 根据任务ID 获取作品数据 并汇总
  async getTaskPostsStatistics(
    taskId: string,
  ) {
    const res = await this.taskRepository.getTaskPostsSummary(taskId)
    return res
  }

  // 根据作品ID 按日期时间段 获取作品数据数组
  async getTaskPostStatisticsDetail(
    platform: string,
    postId: string,
  ) {
    const res = await this.postRepository.getPostDataByDateRange({ platform, postId })
    return res
  }
}
